import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import Port from '../../common/constants/port';
import SettingsKeys from '../enums/settings-keys';
import { getSetting } from '../providers/settings';
import toastMessageChannel from '../ipc/channels/ToastMessageChannel';
import { ERROR_DOWNLOAD_EXE } from '../../common/constants/toast-messages';

const serverUrl = (ip: string) => `http://${ip}:${Port.FILE_SERVER_PORT}/exe`;

const getHostIp = async () => {
  const settings = await getSetting(SettingsKeys.HostIpAddress);
  return settings?.value;
};

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    this.checkForUpdatesAndNotify();
  }

  checkForUpdatesAndNotify = async () => {
    const hostIp = await getHostIp();
    if (!hostIp) return;

    autoUpdater.setFeedURL(serverUrl(hostIp));
    autoUpdater.checkForUpdatesAndNotify();
  };
}

let retryTimer: NodeJS.Timeout | undefined;

/* eslint no-console: off */
export async function updateApp() {
  const hostIp = await getHostIp();
  if (!hostIp) return;

  if (retryTimer) {
    clearTimeout(retryTimer);
  }

  autoUpdater.removeAllListeners();
  autoUpdater.autoDownload = true;
  autoUpdater.setFeedURL(serverUrl(hostIp));
  autoUpdater.checkForUpdates();

  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for new app updates.');
  });

  autoUpdater.on('update-not-available', () => {
    console.log('App update not available.');
  });

  autoUpdater.on('update-available', (updateInfo) => {
    console.log('App update available:', updateInfo);
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log('App download progress:', progress);
  });

  autoUpdater.on('update-downloaded', (updateInfo) => {
    console.log('App update downloaded:', updateInfo);
    autoUpdater.quitAndInstall(true, true);
  });

  autoUpdater.on('error', (message) => {
    console.error('Error in updating app:', message);
    if (message.statusCode === 429) {
      retryTimer = setTimeout(() => {
        retryTimer = undefined;
        updateApp();
      }, 3000);
    } else {
      toastMessageChannel.send(ERROR_DOWNLOAD_EXE);
    }
  });
}
