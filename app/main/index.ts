import Server from './server';
import initDbConnection from './db/connection';
import MainController from './controller/main-controller';
import writeLog from './util/logger';
import LogType from '../common/constants/log-type';
import { SIGNAGE_STARTED } from '../common/constants/log-messages';
import registerChannels from './ipc';
import ActivationChannel from './ipc/channels/ActivationChannel';
import CheckAuthChannel from './ipc/channels/CheckAuthChannel';
import FetchContentChannel from './ipc/channels/FetchContentChannel';
import toastMessageChannel from './ipc/channels/ToastMessageChannel';
import SystemInfo from './providers/system-info';
import { updateSetting } from './providers/settings';
import SettingsKeys from './enums/settings-keys';
import { MessageboardStatus } from './enums/messageboard';
import { getMessageboardStatus } from './providers/authentication';
import { BrowserWindow } from 'electron';

export default function initMain(mainWindow?: BrowserWindow | null) {
  const init = () => {
    writeLog(LogType.INFO, SIGNAGE_STARTED);

    Server();

    registerChannels(
      new CheckAuthChannel(),
      new ActivationChannel(),
      new FetchContentChannel(),
      toastMessageChannel
    );

    // シリアル番号を保存する
    SystemInfo.initialize().then(systemInfo => {
      updateSetting(SettingsKeys.DeviceSerialNo, systemInfo.device.serialNumber).then();
    });

    // [オプションの有効化]
    getMessageboardStatus().then((status) => {
      updateSetting(SettingsKeys.IsEnableOption, status.status === MessageboardStatus.ACTIVATED ? '有効' : '無効').then();
    });

    (() => new MainController(mainWindow))();
  };

  initDbConnection()
    .then(init)
    .catch(() => {
    });
}
