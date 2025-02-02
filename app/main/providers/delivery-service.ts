import { EventEmitter } from 'events';
import port from '../../common/constants/port';
import { Delivery } from '../../common/models/delivery';
import { fetchDelivery, fetchPostDelivery } from './api-request';
import { getSetting } from './settings';
import SettingsKeys from '../enums/settings-keys';
import { deleteFile, isPathExists, outputJsonSync } from '../util/file-util';
import { DELIVERY_JSON_PATH } from '../../common/constants/path';
import SystemInfo from './system-info';
import {
  AssetFileInfo,
  deleteAllAssetsExcept,
  getFileAssets,
  updateAssetsFilePath,
} from '../util/delivery-data';
import { AssetDownloader } from './download';
import writeLog from '../util/logger';
import {
  DOWNLOAD_COMPLETED,
  DOWNLOAD_FAILED,
  DOWNLOAD_STARTED,
} from '../../common/constants/log-messages';
import LogType from '../../common/constants/log-type';
import toastMessageChannel from '../ipc/channels/ToastMessageChannel';
import {
  ERROR_DOWNLOADING_ASSET,
  ERROR_FETCHING_CONTENTS,
} from '../../common/constants/toast-messages';

const fsPort = port.FILE_SERVER_PORT;
const url = (ip: string, paths: string) => `http://${ip}:${fsPort}/${paths}`;

/* eslint no-console: off */
export class DeliveryService extends EventEmitter {
  private delivery?: Delivery;

  private fileAssets: AssetFileInfo[] = [];

  private downloadQueue: AssetFileInfo[] = [];

  private downloaded: AssetFileInfo[] = [];

  private downloadTasks: AssetDownloader[] = [];

  private stopped = false;

  cancel(): void {
    if (this.stopped) return;

    this.stopped = true;
    this.downloadTasks.forEach((downloader) => downloader.stop());
    this.downloaded.forEach((asset) => deleteFile(asset.localPath));
    this.reset();
    this.emit('cancel');
    this.removeAllListeners();
  }

  getDeliveryContents(isPostDelivery = false): DeliveryService {
    this.getDelivery(isPostDelivery);
    return this;
  }

  private async getDelivery(isPostDelivery: boolean): Promise<void> {
    try {
      const { serialNumber } = SystemInfo.Instance.device;
      const hostIp = await this.getHostIp();

      this.delivery = isPostDelivery
        ? await this.getPostDelivery(hostIp, serialNumber)
        : await fetchDelivery(serialNumber, hostIp);

      if (this.stopped) return;

      const { normal, alert } = this.delivery;
      this.fileAssets = [
        ...getFileAssets(normal.timetables),
        ...getFileAssets(alert.timetables),
      ];
      this.downloadAssets(hostIp);
    } catch (e) {
      this.deliveryFinished(e);
      toastMessageChannel.send(ERROR_FETCHING_CONTENTS);
    }
  }

  private getPostDelivery = async (hostIp: string, serialNumber: string) => {
    const setting = await getSetting(SettingsKeys.PostDeliverySchedule);
    const schedule = setting?.value;
    if (schedule) {
      return fetchPostDelivery(schedule, serialNumber, hostIp);
    }
    throw new Error('No post delivery schedule found');
  };

  private deliveryFinished(error?: Error) {
    if (error) {
      this.downloadTasks.forEach((downloader) => downloader.stop());
      this.downloaded.forEach((asset) => deleteFile(asset.localPath));
      this.emit('error', error);
    } else {
      updateAssetsFilePath(this.delivery!);
      outputJsonSync(DELIVERY_JSON_PATH, this.delivery);
      this.cleanupAssets();
      this.emit('finish', this.delivery);
    }
    this.stopped = true;
    this.reset();
  }

  private cleanupAssets(): void {
    const assetPaths = this.fileAssets.map((asset) => asset.localPath);
    deleteAllAssetsExcept(assetPaths);
  }

  private downloadAssets(hostIp: string) {
    this.downloadQueue = [];
    this.downloaded = [];

    try {
      this.fileAssets.forEach((asset) => {
        asset.srcUrl = url(hostIp, asset.srcUrl);
        if (isPathExists(asset.localPath)) {
          console.log(`File exists`, asset.srcUrl, asset.localPath);
        } else if (this.isContainPath(this.downloadQueue, asset.localPath)) {
          console.log(`Queue exists!`, asset.srcUrl, asset.localPath);
        } else {
          this.downloadQueue.push(asset);
          console.log(`Queue Added`, asset.srcUrl, asset.localPath);
        }
      });

      this.emit('download-start', this.downloadQueue.length);
      this.startDownload();
    } catch (e) {
      this.deliveryFinished(e);
      toastMessageChannel.send(ERROR_DOWNLOADING_ASSET);
    }
  }

  private isContainPath(downloadQueue: AssetFileInfo[], localPath: String) {

    let result = false
    downloadQueue.forEach((queue) => {
      if (queue.localPath === localPath) {
        //
        result = true
      }
    });

    return result
  }

  /**
   * Start downloading of assets one at a time from queue.
   */
  private startDownload = () => {
    if (this.stopped) return;

    const assetInfo = this.dequeue();
    if (!assetInfo) {
      this.deliveryFinished();
      return;
    }

    const { srcUrl, localPath } = assetInfo;
    writeLog(LogType.INFO, `${DOWNLOAD_STARTED}「${srcUrl}」`);

    const downloader = new AssetDownloader();
    this.downloadTasks.push(downloader);
    downloader
      .download(srcUrl, localPath)
      .on('complete', () => {
        writeLog(LogType.INFO, `${DOWNLOAD_COMPLETED}「${srcUrl}」`);
        this.downloadTasks.shift();
        this.downloaded.push(assetInfo);
        // Start new download
        this.startDownload();
      })
      .on('progress', (progress: number) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(srcUrl, `${progress}%`);
        }
        this.emit('download-progress', this.calcProgress(progress));
      })
      .on('error', (e) => {
        console.log(`Failed to download ${srcUrl}`);
        writeLog(LogType.ERROR, `${DOWNLOAD_FAILED}${srcUrl}`);
        writeLog(LogType.ERROR, e.message);
        this.deliveryFinished(e);
      });
  };

  private dequeue(): AssetFileInfo | undefined {
    return this.downloadQueue.shift();
  }

  /**
   * Calculate the progress percentage of all assets.
   * @param currentProgress Progress of current downloaded asset.
   */
  private calcProgress(currentProgress: number): number {
    const { downloadQueue, downloaded, downloadTasks } = this;
    const totalPercent =
      (downloaded.length + downloadQueue.length + downloadTasks.length) * 100;
    const downloadedPercent = currentProgress + downloaded.length * 100;
    return Math.floor((downloadedPercent / totalPercent) * 100);
  }

  private getHostIp = async () => {
    const hostSetting = await getSetting(SettingsKeys.HostIpAddress);
    const hostIp = hostSetting?.value;
    if (!hostIp) {
      throw new Error('Host ip address not found');
    }
    return hostIp;
  };

  private reset(): void {
    this.delivery = undefined;
    this.downloadQueue = [];
    this.downloaded = [];
    this.downloadTasks = [];
    this.fileAssets = [];
  }
}

export declare interface DeliveryService {
  on(event: 'download-start', callback: (totalDownload: number) => void): this;
  on(event: 'download-progress', callback: (progress: number) => void): this;
  on(event: 'finish', callback: (delivery: Delivery) => void): this;
  on(event: 'cancel', callback: (reason?: string) => void): this;
  on(event: 'error', callback: (error: Error) => void): this;
}
