import * as shutdown from 'electron-shutdown-command';
import moment from 'moment';
import WebSocketClient, { SocketMessageListener } from '../providers/web-socket-client';
import ContentMode from '../enums/content-mode';
import { updateApp } from '../util/app-updater';
import { Delivery } from '../../common/models/delivery';
import { getSetting, updateSetting } from '../providers/settings';
import SettingsKeys from '../enums/settings-keys';
import SettingsEntity from '../entities/SettingsEntity';
import SystemInfo from '../providers/system-info';
import DeviceStatus from '../enums/device-status';
import { deletePostDeliveryDateTime, getDeliveryJson, setPostDeliveryDateTime } from '../providers/delivery';
import Heartbeat from '../models/heartbeat';
import writeLog from '../util/logger';
import LogType from '../../common/constants/log-type';
import { NO_DELIVERY_FOUND, PLAYING_ALERT_CONTENTS, PLAYING_NORMAL_CONTENTS } from '../../common/constants/log-messages';
import { startListening, stopListening } from '../providers/usb-detection';
import { MessageboardStatus } from '../enums/messageboard';
import { MessageboardStatusValue } from '../models/messageboard';
import { activateMessageboardStatus, createAuthFile, getMessageboardStatus, isAppAuthenticated, MESSAGE_BOARD_AUTH_KEY } from '../providers/authentication';
import { TimetableChecker } from '../providers/timetable-checker';
import Scheduler from '../providers/scheduler';
import { updateSystemRebootTimeTrigger } from '../util/system-reboot';
import updateSystemTime from '../util/system-time';
import { DeliveryService } from '../providers/delivery-service';
import toastMessageChannel from '../ipc/channels/ToastMessageChannel';
import { version } from '../../package.json';
import { DOWNLOADING_CONTENTS, NO_DOWNLOADED_CONTENTS, PLAY_ALERT_CONTENTS, PLAY_NORMAL_CONTENTS, REBOOTING_DEVICE, UPDATED_POST_DELIVERY_TIME, UPDATED_REBOOT_TIME, UPDATING_APPLICATION, UPDATING_TIMETABLE_CONTENTS } from '../../common/constants/toast-messages';
import { BrowserWindow } from 'electron';
import AssetType from '../../common/constants/asset-type';
import { RESOURCES_PATH } from '../../common/constants/path';
import path from 'path';

/* eslint global-require: off, no-console: off */
export default class MainController implements SocketMessageListener {
  private readonly HEARTBEAT_INTERVAL = 5; // seconds

  private timetableChecker: TimetableChecker;

  private wsc?: WebSocketClient;

  private hostIpAddress?: string;

  private totalDownload = 0;

  private completedPercent = 0;

  private statusCode: number = DeviceStatus.IDLE;

  private currentMode?: SettingsEntity;

  private postDeliveryScheduler?: Scheduler;

  private heartbeatTimer?: NodeJS.Timeout;

  private messageBoardStatus?: MessageboardStatusValue;

  private syncTimeStatus?: string;

  private deliveryService?: DeliveryService;

  private syncDisplayOffStatus?: string;

  private is_displayoff: number = 0;

  private insertionStartDatetime?: string;
  private insertionEndDatetime?: string;

  private mainWindow?: BrowserWindow | null;
  //private mainWindowType: string = '';

  constructor(mainWindow?: BrowserWindow | null) {
    this.mainWindow = mainWindow;
    this.timetableChecker = TimetableChecker.Instance;
    this.timetableChecker.on('display-power-on', this.doReloadMainWindow);
    this.initialize();
  }

  private async initialize() {
    const setting = await getSetting(SettingsKeys.HostIpAddress);
    if (setting) {
      this.hostIpAddress = setting.value;
    }

    this.currentMode = await getSetting(SettingsKeys.ContentMode);
    this.timetableChecker.mode = this.currentMode?.value as ContentMode;

    await this.checkMessageboardStatus();
    await this.checkSyncTimeStatus();
    await this.checkSyncDisplayOffStatus();
    await this.checkIsDisplayOff();
    await this.checkInsertionDatetime();

    this.wsc = new WebSocketClient(this, this.hostIpAddress);

    let delivery = getDeliveryJson();
    //console.log('delivery');
    //console.log(delivery);

    if (!delivery) {
      writeLog(LogType.INFO, NO_DELIVERY_FOUND);
      toastMessageChannel.send(NO_DOWNLOADED_CONTENTS);
      if (await isAppAuthenticated()) {
        if (this.hostIpAddress) {
          // no-contents
          delivery = this.createDelivery('no-contents.html');
        } else {
          // no-connect
          delivery = this.createDelivery('no-connect.html');
        }
        this.timetableChecker.mode = ContentMode.Normal;
        //console.log(delivery);
        // this.changeMainWindow(this.hostIpAddress ? 'no-contents' : 'no-connect');
      } else {
        // 未認証状態のときもダミーHTMLをセット
        delivery = this.createDelivery('no-connect.html');
        this.timetableChecker.mode = ContentMode.Normal;
      }
    }
    this.timetableChecker.delivery = delivery;
    this.timetableChecker.startChecker();

    this.initUsbDetection();
    await this.checkPostDeliverySchedule();
  }

  createDelivery = (htmlFilename: string): Delivery => {
    console.log('create delivery');
    console.log(htmlFilename);
    let url = `file://` + path.join(RESOURCES_PATH, 'html', htmlFilename);
    console.log(url);
    return {
      'alert': {
        id: -1,
        title: '',
        'timetables': [{
          'id': -1,
          'title': '',
          'contents': [{
            'id': -1,
            'title': '',
            'width': 1920,
            'height': 1080,
            'startTime': '00:00',
            'endTime': '24:00',
            'pages': [{
              'number': 1,
              'bgColor': '#ffffff',
              'actionType': undefined,
              'actionPage': undefined,
              actionDuration: undefined,
              assets: [{
                type: AssetType.WEB,
                src: url,
                x: 0,
                y: 0,
                z: 0,
                width: 1920,
                height: 1080,
                link: undefined,
                linkType: 'none',
                dateFormat: '',
                weekFormat: '',
                countFormat: '',
                countType: '',
                baseDate: '',
                timeFormat: '',
                qrImage: ''
              }]
            }]
          }]
        }],
        'deliveryTimetables': [{
          type: 'DEFAULT',
          'priority': 5,
          'dayNumber': '',
          'dayOfWeek': '',
          'startDate': '',
          'endDate': '',
          'date': '',
          'timetableId': -1
        }]
      },
      'normal': {
        'id': -1,
        'title': '',
        'timetables': [{
          'id': -1,
          'title': '',
          'contents': [{
            'id': -1,
            'title': '',
            'width': 1920,
            'height': 1080,
            'startTime': '00:00',
            'endTime': '24:00',
            'pages': [{
              'number': 1,
              'bgColor': '#ffffff',
              'actionType': undefined,
              'actionPage': undefined,
              actionDuration: undefined,
              assets: [{
                type: AssetType.WEB,
                src: url,
                x: 0,
                y: 0,
                z: 0,
                width: 1920,
                height: 1080,
                link: undefined,
                linkType: 'none',
                dateFormat: '',
                weekFormat: '',
                countFormat: '',
                countType: '',
                baseDate: '',
                timeFormat: '',
                qrImage: ''
              }]
            }]
          }]
        }],
        'deliveryTimetables': [{
          type: 'DEFAULT',
          'priority': 5,
          'dayNumber': '',
          'dayOfWeek': '',
          'startDate': '',
          'endDate': '',
          'date': '',
          'timetableId': -1
        }]
      }


    };
  };

  private initUsbDetection() {
    if (this.messageBoardStatus) {
      const { status } = this.messageBoardStatus;
      if (status === MessageboardStatus.ACTIVATED) return;
    }

    startListening(async (isFound) => {
      if (isFound) {
        await this.activateMessageboard();
      } else {
        console.log('Activation file not found or invalid');
      }
    });
  }

  // @Override
  onAppUpdateReceived = async (newVersion: string) => {
    if (newVersion > version) {
      toastMessageChannel.send(`${UPDATING_APPLICATION} ${version}`);
      await updateApp();
    }
  };

  // @Override
  onMessageboardActivateReceived = async (serialKey: string) => {
    if (serialKey) {
      await this.activateMessageboard(serialKey);
    }
  };

  // @Override
  async onNewDeliveryReceived() {
    toastMessageChannel.send(UPDATING_TIMETABLE_CONTENTS);
    await this.getDelivery();
  }

  // @Override
  onPostDeliveryReceived = async (isCancel: boolean, dateTime?: string) => {
    if (isCancel) {
      await deletePostDeliveryDateTime();
      this.cancelPostDeliverySchedule();
      return;
    }

    if (dateTime) {
      const currentDateTime = moment(new Date()).format('YYYY-MM-DD HH:mm');
      if (dateTime < currentDateTime) {
        console.log(`Delivery schedule has already passed: ${dateTime}`);
        await deletePostDeliveryDateTime();
        this.cancelPostDeliverySchedule();
        return;
      }

      await setPostDeliveryDateTime(dateTime);
      await this.schedulePostDelivery(dateTime);
      toastMessageChannel.send(UPDATED_POST_DELIVERY_TIME);
    }
  };

  // @Override
  onRebootReceived = async (rebootTime?: string) => {
    if (rebootTime) {
      await updateSetting(SettingsKeys.SystemRebootTime, rebootTime);
      const time = moment(rebootTime, ['HH:mm']).format('h:mmA');
      updateSystemRebootTimeTrigger(time);
      toastMessageChannel.send(UPDATED_REBOOT_TIME);
    } else {
      toastMessageChannel.send(REBOOTING_DEVICE);
      shutdown.reboot();
    }
  };

  // @Override
  async onSwitchModeReceived(mode: ContentMode, insertionStartDatetime?: string, insertionEndDatetime?: string) {

    // パラメータ保存
    this.insertionStartDatetime = insertionStartDatetime ? insertionStartDatetime : '';
    this.insertionEndDatetime = insertionEndDatetime ? insertionEndDatetime : '';
    await updateSetting(SettingsKeys.InsertionStartDatetime, this.insertionStartDatetime);
    await updateSetting(SettingsKeys.InsertionEndDatetime, this.insertionEndDatetime);

    let changeToMode = mode;
    if (mode !== this.currentMode?.value || mode === ContentMode.Alert) { // 差込モードの場合は条件が変更されている可能性があるため常に実行
      if (mode === ContentMode.Alert) {
        let isImmediate = false;
        if(!this.insertionStartDatetime && !this.insertionEndDatetime){
          // 即時切替
          isImmediate = true;
        } else if(!this.insertionStartDatetime){
          // 終了日時のみ指定されている場合も即時切替
          isImmediate = true;
        }
        if(isImmediate){
          changeToMode = ContentMode.Alert;
        }else{
          changeToMode = ContentMode.Normal;
        }
      } else {
        changeToMode = ContentMode.Normal;
      }

      if(changeToMode === ContentMode.Alert){
        writeLog(LogType.INFO, PLAYING_ALERT_CONTENTS);
        toastMessageChannel.send(PLAY_ALERT_CONTENTS);
      }else{
        writeLog(LogType.INFO, PLAYING_NORMAL_CONTENTS);
        toastMessageChannel.send(PLAY_NORMAL_CONTENTS);
      }

      this.timetableChecker.mode = changeToMode;
      this.timetableChecker.restartChecker();

      //
      if(this.insertionStartDatetime || this.insertionEndDatetime){
        this.restartModeChecker();
      }
      this.currentMode = await updateSetting(SettingsKeys.ContentMode, changeToMode);
    }
  }

  //--------------------------
  // 差込モード変更タイマー関連
  //--------------------------
  private timer?: NodeJS.Timeout;
  private readonly CHECK_INTERVAL = 1000;
  startModeChecker() {
    this.timer = setInterval(async () => {
      const currentDatetime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
      let changeToMode = null;

      // 開始日時に到達（通常→差込）
      if(this.insertionStartDatetime && this.insertionStartDatetime < currentDatetime){
        changeToMode = ContentMode.Alert;
        this.insertionStartDatetime = '';
        await updateSetting(SettingsKeys.InsertionStartDatetime, '');
      }
      // 終了日時に到達（差込→通常）
      if(this.insertionEndDatetime && this.insertionEndDatetime < currentDatetime){
        changeToMode = ContentMode.Normal;
        this.insertionEndDatetime = '';
        await updateSetting(SettingsKeys.InsertionEndDatetime, '');
      }
      // モード変更が発生した場合
      if(changeToMode){
        if(changeToMode === ContentMode.Alert){
          writeLog(LogType.INFO, PLAYING_ALERT_CONTENTS);
          toastMessageChannel.send(PLAY_ALERT_CONTENTS);
        }else{
          writeLog(LogType.INFO, PLAYING_NORMAL_CONTENTS);
          toastMessageChannel.send(PLAY_NORMAL_CONTENTS);
        }
        this.timetableChecker.mode = changeToMode;
        this.timetableChecker.restartChecker();
        this.currentMode = await updateSetting(SettingsKeys.ContentMode, changeToMode);
      }
      // 開始・終了日時ともに完了した場合はタイマー停止
      if(!this.insertionStartDatetime && !this.insertionEndDatetime){
        this.stopModeChecker();
      }

    }, this.CHECK_INTERVAL);
  }
  stopModeChecker() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
  restartModeChecker(): void {
    this.stopModeChecker();
    this.startModeChecker();
  }

  // @Override
  onSyncTimeReceived = (dateTime: string) => {
    updateSystemTime(dateTime, async (status) => {
      this.syncTimeStatus = status;
      writeLog(LogType.INFO, "端末の時刻同期リクエストを受信しました。処理結果："+status+', '+this.hostIpAddress);
      await updateSetting(SettingsKeys.SyncTimeStatus, status);
    });
  };

  // @Override
  onSyncDisplayOffReceived = async (isDisplayOff: string) => {
    this.is_displayoff = parseInt(isDisplayOff);
    this.syncDisplayOffStatus = 'success';
    await updateSetting(SettingsKeys.IsDisplayOff, isDisplayOff);
    await updateSetting(SettingsKeys.SyncDisplayOffStatus, 'success');
    //
    this.timetableChecker.displayOff = this.is_displayoff;
  };

  // @Override
  async onWebsocketConnected(ipAddress: string) {
    await this.checkMessageboardStatus();
    await this.sendHeartbeat();

    if (this.hostIpAddress !== ipAddress) {
      if (!this.hostIpAddress) {
        // 初めてIPアドレス取得できた
        // this.changeMainWindow('no-contents');
        let delivery = this.createDelivery('no-contents.html');
        this.timetableChecker.stopChecker();
        this.timetableChecker.delivery = delivery;
        this.timetableChecker.mode = ContentMode.Normal;
        this.timetableChecker.startChecker();
      }
      this.hostIpAddress = ipAddress;
      await updateSetting(SettingsKeys.HostIpAddress, ipAddress);
    }
  }

  // @Override
  onWebsocketDisconnected() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
    console.log('heartbeat stopped');
  }

  private activateMessageboard = async (key?: string) => {
    this.messageBoardStatus = await activateMessageboardStatus(
      MessageboardStatus.ACTIVATED,
      key
    );
    console.log('Messageboard successfully activated');
    // auth.txtを書き替える
    createAuthFile(MESSAGE_BOARD_AUTH_KEY);

    stopListening();
  };

  private async checkMessageboardStatus() {
    const status = await getMessageboardStatus();
    if (status) {
      this.messageBoardStatus = status;
    }
  }

  private async checkSyncTimeStatus() {
    const status = await getSetting(SettingsKeys.SyncTimeStatus);
    if (status) {
      this.syncTimeStatus = status.value;
    }
  }

  private async checkSyncDisplayOffStatus() {
    const status = await getSetting(SettingsKeys.SyncDisplayOffStatus);
    if (status) {
      this.syncDisplayOffStatus = status.value;
    }
  }

  private async checkIsDisplayOff() {
    const status = await getSetting(SettingsKeys.IsDisplayOff);
    if (status) {
      this.is_displayoff = parseInt(status.value);
    } else {
      this.is_displayoff = 0;
    }
    this.timetableChecker.displayOff = this.is_displayoff;
  }
  private async checkInsertionDatetime() {
    const startStatus = await getSetting(SettingsKeys.InsertionStartDatetime);
    if(startStatus) {
      this.insertionStartDatetime = startStatus.value;
    }else{
      this.insertionStartDatetime = '';
    }
    const endStatus = await getSetting(SettingsKeys.InsertionEndDatetime);
    if(endStatus) {
      this.insertionEndDatetime = endStatus.value;
    }else{
      this.insertionEndDatetime = '';
    }
    // いずれかが設定されている場合はタイマー監視スタート
    if(this.insertionStartDatetime || this.insertionEndDatetime){
      this.restartModeChecker();
    }
}

  private sendHeartbeat() {
    if (this.heartbeatTimer) return;

    const deviceInfo = SystemInfo.Instance.device;

    const send = () => {
      const heartbeat: Heartbeat = Object.assign(new Heartbeat(), deviceInfo);
      heartbeat.totalDownload = this.totalDownload;
      heartbeat.completedCount = this.completedPercent;
      heartbeat.status = this.statusCode;
      heartbeat.deliveryMode = this.currentMode?.value;
      // メッセージボード返信、ディスプレイOFF機能対応版
      heartbeat.availableReply = 1;
      heartbeat.availableDisplayOff = 1;
      heartbeat.is_displayoff = this.is_displayoff;
      // 差込コンテンツ対応版
      heartbeat.availableInsertionContents = 1;
      heartbeat.insertionStartDatetime = this.insertionStartDatetime;
      heartbeat.insertionEndDatetime = this.insertionEndDatetime;

      if (this.timetableChecker.delivery) {
        const { normal, alert } = this.timetableChecker.delivery;
        heartbeat.normalDeliveryId = normal.id;
        heartbeat.alertContentId = alert.timetables[0]?.contents[0]?.id;
      }
      if (this.messageBoardStatus) {
        const { key, status } = this.messageBoardStatus;
        heartbeat.messageboardSerialKey = key;
        heartbeat.messageboardEnabled = status === MessageboardStatus.ACTIVATED;
      }
      if (this.syncTimeStatus) {
        heartbeat.syncTimeStatus = this.syncTimeStatus;
      }
      if (this.syncDisplayOffStatus) {
        heartbeat.syncDisplayOffStatus = this.syncDisplayOffStatus;
      }
      this.wsc?.send(JSON.stringify(heartbeat));
    };

    send();
    this.heartbeatTimer = setInterval(send, this.HEARTBEAT_INTERVAL * 1000);
    console.log('heartbeat sent');
  }

  private async checkPostDeliverySchedule() {
    const postDelivery = await getSetting(SettingsKeys.PostDeliverySchedule);
    if (postDelivery) {
      const schedule = postDelivery.value;
      const currentDateTime = moment(new Date()).format('YYYY-MM-DD HH:mm');

      if (schedule < currentDateTime) {
        console.log(`Delivery schedule has already passed: ${schedule}`);
        await deletePostDeliveryDateTime();
        this.cancelPostDeliverySchedule();
        return;
      }

      await this.schedulePostDelivery(postDelivery.value);
    }
  }

  private cancelPostDeliverySchedule() {
    if (this.postDeliveryScheduler) {
      this.postDeliveryScheduler.cancel();
    }
  }

  private async schedulePostDelivery(dateTime: string) {
    // Cancel previous post delivery job
    this.cancelPostDeliverySchedule();
    // Create new post delivery job
    const callback = () => this.getDelivery(true);
    this.postDeliveryScheduler = new Scheduler(
      'Delivery Schedule',
      dateTime,
      callback
    );
  }

  private async getDelivery(isPostDelivery = false) {
    //if (this.currentMode?.value !== ContentMode.Normal) {
    //  // Always change back to normal mode if new delivery
    //  this.currentMode = await updateSetting(
    //    SettingsKeys.ContentMode,
    //    ContentMode.Normal
    //  );
    //}
    // Cancel if service is currently running
    this.deliveryService?.cancel();

    this.statusCode = DeviceStatus.DOWNLOADING;

    this.deliveryService = new DeliveryService();
    this.deliveryService
      .getDeliveryContents(isPostDelivery)
      .on('download-start', (totalDownload) => {
        this.totalDownload = totalDownload;
      })
      .on('download-progress', (progress) => {
        this.completedPercent = progress;
      })
      .on('finish', async (delivery: Delivery) => {
        //console.log(`delivery finished: ${delivery.normal.title}`);
        toastMessageChannel.send(DOWNLOADING_CONTENTS);
        //toastMessageChannel.send(PLAY_NORMAL_CONTENTS);
        this.totalDownload = 0;
        this.completedPercent = 0;
        this.statusCode = DeviceStatus.IDLE;

        this.timetableChecker.stopChecker();
        this.timetableChecker.delivery = delivery;

        // 差込コンテンツ対応
        this.insertionStartDatetime = delivery.alert.insertionStartDatetime ? delivery.alert.insertionStartDatetime : '';
        this.insertionEndDatetime = delivery.alert.insertionEndDatetime ? delivery.alert.insertionEndDatetime : '';
        await updateSetting(SettingsKeys.InsertionStartDatetime, this.insertionStartDatetime);
        await updateSetting(SettingsKeys.InsertionEndDatetime, this.insertionEndDatetime);
        let changeToMode = ContentMode.Normal;
        let isImmediate = false;
        if(delivery.alert.toInsertion){
          if(!this.insertionStartDatetime && !this.insertionEndDatetime){
            // 即時切替
            isImmediate = true;
          } else if(!this.insertionStartDatetime){
            // 終了日時のみ指定されている場合も即時切替
            isImmediate = true;
          }
          if(isImmediate){
            changeToMode = ContentMode.Alert;
          }else{
            changeToMode = ContentMode.Normal;
          }
        }else{
          changeToMode = ContentMode.Normal;
        }
        this.timetableChecker.mode = changeToMode;
        this.timetableChecker.startChecker();
        // this.changeMainWindow();

        if(this.insertionStartDatetime || this.insertionEndDatetime){
          this.restartModeChecker();
        }
        this.currentMode = await updateSetting(SettingsKeys.ContentMode, changeToMode);
        //
        let extraInfo = '（';
        extraInfo = extraInfo + 'スケジュール：' + delivery.normal.title;
        if (delivery.alert == null || delivery.alert.timetables.length == 0) {
          extraInfo = extraInfo + ', 差込コンテンツ：' + '（なし）';
        } else {
          if(delivery.alert.timetables[0].contents[0].title){
            extraInfo = extraInfo + ', 差込コンテンツ：' + delivery.alert.timetables[0].contents[0].title;
          } else {
            extraInfo = extraInfo + ', 差込コンテンツ：' + '（なし）';
          }
        }
        extraInfo = extraInfo + ', 配信後に差込モード切替：' + (delivery.alert.toInsertion ? 'する' : 'しない');
        if(delivery.alert.toInsertion){
          if(isImmediate && (!this.insertionStartDatetime && !this.insertionEndDatetime)){
            extraInfo = extraInfo + ', 即時';
          }else{
            extraInfo = extraInfo + ', ' + (this.insertionStartDatetime ? this.insertionStartDatetime : '') + '～' + (this.insertionEndDatetime ? this.insertionEndDatetime : '');
          }
        }
        extraInfo = extraInfo + '）';
        writeLog(LogType.INFO, 'スケジュール/差込コンテンツのDLが完了しました。' + extraInfo);
  
        if (isPostDelivery) {
          await deletePostDeliveryDateTime();
        }
      })
      .on('error', (error) => {
        console.log('delivery finished with error:', error);
        this.statusCode = DeviceStatus.ERROR;
        this.totalDownload = 0;
        this.completedPercent = 0;
      });
  }

  private async doReloadMainWindow() {
    console.log('force reload window!');
    writeLog(LogType.INFO, 'ウィンドウ再読み込み要求実行');
    if (this.mainWindow) {
      writeLog(LogType.INFO, 'ウィンドウ再読み込み要求実行');
      this.mainWindow?.reload();
    } else {
      writeLog(LogType.INFO, 'ウィンドウ再読み込み要求実行できず');
    }
  }

  /**
   * メインウィンドウの表示切替
   */
  // private changeMainWindow(changeToType: string = '') {
  //   this.mainWindowType = changeToType;
  //   return;
  //   /*
  //       // 通常のURL（コンテンツプレイヤー）
  //       let url = `file://${__dirname}/app.html`;
  //       // その他の特殊な画面表示の場合
  //       switch(changeToType){
  //         case 'no-contents':
  //           url = `file://` + path.join(RESOURCES_PATH, 'html', 'no-contents.html');
  //           break;
  //         case 'no-connect':
  //           url = `file://` + path.join(RESOURCES_PATH, 'html', 'no-connect.html');
  //           break;
  //         default:
  //           //console.log('disp contents window(normal)');
  //           break;
  //       }
  //       // URLを変更する
  //       if(this.mainWindowType !== changeToType){
  //         this.mainWindow?.loadURL(url);
  //         this.mainWindowType = changeToType;
  //       }
  //     */
  // }

}
