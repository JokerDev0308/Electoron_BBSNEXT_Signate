import WebSocket from 'ws';
import dgram from 'dgram';
import {sprintf} from 'sprintf-js';
import Port from '../../common/constants/port';
import HostMessageCode from '../enums/host-message-code';
import SystemInfo from './system-info';
import ContentMode from '../enums/content-mode';
import {isAppAuthenticated} from './authentication';
import writeLog from '../util/logger';
import LogType from '../../common/constants/log-type';
import toastMessageChannel from '../ipc/channels/ToastMessageChannel';
import {
  ALERT_MODE_SWITCH_RECEIVED,
  NEW_DELIVERY_RECEIVED,
  NORMAL_MODE_SWITCH_RECEIVED,
  RESTART_DEVICE,
  APP_UPDATE_RECEIVED,
  UPDATE_REBOOT_TIME_RECEIVED,
  ERROR_CONNECTING_TO_HOST,
  DEVICE_INFO_SENT,
  BROADCAST_MESSAGE_RECEIVED,
  UPDATE_VERSION,
} from '../../common/constants/log-messages';
import {
  CONNECTED_TO_HOST,
  DEVICE_INFO,
  ERROR_SENDING_DEVICE_INFO,
  ERROR_READING_RESPONSE,
  SCAN_FOR_HOST,
} from '../../common/constants/toast-messages';
import { updateSetting } from './settings';
import SettingsKeys from '../enums/settings-keys';
import moment from 'moment';

/* eslint no-console: off */
export default class WebSocketClient {
  private readonly RECONNECT_INTERVAL = 1500;

  private readonly RECONNECT_LIMIT = 3;

  private readonly WS_CLOSE_NORMAL = 1000;

  private ws?: WebSocket;

  private listener: SocketMessageListener;

  private socketConnRetryCount: number;

  private hostIpAddress?: string;

  private isClosed = true;

  private retryTimer?: NodeJS.Timeout;

  constructor(listener: SocketMessageListener, hostAddress?: string) {
    this.listener = listener;
    this.hostIpAddress = hostAddress;
    this.socketConnRetryCount = this.RECONNECT_LIMIT;

    this.openDgramSocket();

    if (this.hostIpAddress) {
      this.openWebSocket(this.hostIpAddress);
    } else {
      toastMessageChannel.send(SCAN_FOR_HOST);
    }
  }

  send(message: string) {
    if (this.ws && !this.isClosed) {
      this.ws.send(message);
    }
  }

  private openDgramSocket(): void {
    const dgramSocket = dgram.createSocket('udp4');

    dgramSocket.on('message', async (msg, {address}) => {
      const {broadcastCode} = JSON.parse(msg.toString());
      if (broadcastCode === HostMessageCode.Broadcast) {
        console.log(`broadcast received: ${address} ${msg}`);
        writeLog(LogType.INFO, BROADCAST_MESSAGE_RECEIVED);

        if (!SystemInfo.Instance.device.ipAddress) {
          await SystemInfo.Instance.initNetwork();
        }

        this.onBroadcastReceived(address);
      }
    });

    dgramSocket.on('listening', () => {
      const {port} = dgramSocket.address();
      console.log(`dgram socket listening on port ${port}`);
    });

    dgramSocket.bind(Port.DT_PORT);
  }

  private async openWebSocket(hostIpAddress: string) {
    if (!(await isAppAuthenticated())) {
      return;
    }

    this.ws = new WebSocket(`ws://${hostIpAddress}:${Port.WS_PORT}`);

    this.ws.on('open', () => {
      console.log('WebSocket open');
      this.handleOpenConnection(hostIpAddress);
      this.socketConnRetryCount = this.RECONNECT_LIMIT;
    });

    this.ws.on('message', (message: WebSocket.Data) => {
      this.handleMessageReceived(message);
    });

    this.ws.on('close', (code) => {
      console.log(`WebSocket closed - code: ${code}`);
      if (code !== this.WS_CLOSE_NORMAL) {
        this.reconnect(hostIpAddress);
      }
      if (!this.isClosed) {
        this.handleCloseConnection();
      }
    });

    this.ws.on('error', (error: any) => {
      console.warn(`WebSocket error - reason: ${error.code}`);
      if (error.code === 'ECONNREFUSED') {
        this.reconnect(hostIpAddress);
      }
    });
  }

  private async reconnect(ipAddress: string) {
    if (this.ws) {
      this.ws.removeAllListeners();
    }

    // 自分のIPアドレスを再確認する
    await SystemInfo.Instance.initNetwork();


    if (this.socketConnRetryCount > 0) {
      console.log('WebSocket reconnecting');
      this.retryTimer = setTimeout(
        () => this.openWebSocket(ipAddress),
        this.RECONNECT_INTERVAL
      );
      this.socketConnRetryCount -= 1;
    } else {
      console.error('WebSocket reconnection limit reached');
      writeLog(LogType.ERROR, `${ipAddress}${ERROR_CONNECTING_TO_HOST}`);
    }
  }

  private handleOpenConnection(hostIpAddress: string) {
    console.log(`Connected to host ${hostIpAddress}\n`);

    const deviceInfo = SystemInfo.Instance.device;

    if (this.hostIpAddress !== hostIpAddress) {
      if (this.ws) {
        this.ws.send(JSON.stringify(deviceInfo), (err: Error | undefined) => {
          if (err) {
            writeLog(
              LogType.ERROR,
              `${ERROR_SENDING_DEVICE_INFO}:${err.message}`
            );
            toastMessageChannel.send(ERROR_SENDING_DEVICE_INFO);
          } else {
            writeLog(LogType.INFO, DEVICE_INFO_SENT + this.hostIpAddress);
            toastMessageChannel.send(
              sprintf(
                DEVICE_INFO,
                deviceInfo.serialNumber,
                deviceInfo.ipAddress,
                deviceInfo.manufacturer,
                deviceInfo.osVersion
              )
            );
          }
        });
      }
      this.hostIpAddress = hostIpAddress;
    } else {
      toastMessageChannel.send(sprintf(CONNECTED_TO_HOST, hostIpAddress));
    }

    // [配信PCへの最終通信日時]
    updateSetting(SettingsKeys.HostPcLastConnection, moment().format("YYYY/MM/DD HH:mm:ss")).then();

    this.isClosed = false;
    this.listener.onWebsocketConnected(hostIpAddress);
  }

  private handleCloseConnection = () => {
    console.log('Connection closed');
    this.isClosed = true;
    this.listener.onWebsocketDisconnected();
  };

  private handleMessageReceived = (message: WebSocket.Data) => {
    let data: any;
    try {
      console.log(`WebSocket message received: ${message}`);
      data = JSON.parse(message.toString());
    } catch (error) {
      //writeLog(LogType.ERROR, `${ERROR_READING_RESPONSE}:${error}}`);
      toastMessageChannel.send(ERROR_READING_RESPONSE);
      return;
    }
    switch (data.messageCode) {
      case HostMessageCode.Alert:
        let extraInfo = '';
        if(!data.insertionStartDatetime && !data.insertionEndDatetime){
          extraInfo = extraInfo + ' 即時';
        }else{
          extraInfo = extraInfo + ' ' + (data.insertionStartDatetime ? data.insertionStartDatetime : '') + '～' + (data.insertionEndDatetime ? data.insertionEndDatetime : '');
        }
        writeLog(LogType.INFO, ALERT_MODE_SWITCH_RECEIVED + extraInfo + ', ' + this.hostIpAddress);
        this.listener.onSwitchModeReceived(ContentMode.Alert, data.insertionStartDatetime, data.insertionEndDatetime);
        break;
      case HostMessageCode.Normal:
        writeLog(LogType.INFO, NORMAL_MODE_SWITCH_RECEIVED + this.hostIpAddress);
        this.listener.onSwitchModeReceived(ContentMode.Normal, data.insertionStartDatetime, data.insertionEndDatetime);
        break;
      case HostMessageCode.NewUpdate:
        writeLog(LogType.INFO, NEW_DELIVERY_RECEIVED + this.hostIpAddress);
        this.listener.onNewDeliveryReceived();
        break;
      case HostMessageCode.PostDelivery:
        /* eslint no-case-declarations: off */
        const {scheduleDate, scheduleTime} = data;
        const dateTime = `${scheduleDate} ${scheduleTime}`;
        this.listener.onPostDeliveryReceived(false, dateTime);
        break;
      case HostMessageCode.CancelPostDelivery:
        this.listener.onPostDeliveryReceived(true);
        break;
      case HostMessageCode.Reboot:
        writeLog(LogType.INFO, RESTART_DEVICE + this.hostIpAddress);
        this.listener.onRebootReceived();
        break;
      case HostMessageCode.UpdateApp:
        writeLog(LogType.INFO, APP_UPDATE_RECEIVED + this.hostIpAddress);
        writeLog(LogType.INFO, UPDATE_VERSION + data.exe.exeVersion);
        this.listener.onAppUpdateReceived(data.exe.exeVersion);
        break;
      case HostMessageCode.UpdateReboot:
        writeLog(LogType.INFO, UPDATE_REBOOT_TIME_RECEIVED + this.hostIpAddress);
        this.listener.onRebootReceived(data.rebootTime);
        break;
      case HostMessageCode.ActivateMessageboard:
        this.listener.onMessageboardActivateReceived(data.serialKey);
        break;
      case HostMessageCode.SyncTime:
        this.listener.onSyncTimeReceived(data.utcTime);
        break;
      case HostMessageCode.SyncDisplayOff:
        this.listener.onSyncDisplayOffReceived(data.is_displayoff);
        break;
      default:
        console.error(`Invalid message code: ${data.messageCode}`);
        break;
    }
  };

  private onBroadcastReceived(ipAddress: string) {
    if (this.hostIpAddress !== ipAddress || this.isClosed) {
      if (this.ws) {
        this.ws.close(this.WS_CLOSE_NORMAL);
        this.ws.removeAllListeners();
      }
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = undefined;
      }
      this.openWebSocket(ipAddress);
    } else {
      toastMessageChannel.send(sprintf(CONNECTED_TO_HOST, ipAddress));
    }
  }
}

export interface SocketMessageListener {
  onSwitchModeReceived(mode: ContentMode, insertionStartDatetime?: string, insertionEndDatetime?: string): void;

  onNewDeliveryReceived(): void;

  onPostDeliveryReceived(isCancel: boolean, dateTime?: string): void;

  onRebootReceived(rebootTime?: string): void;

  onAppUpdateReceived(newVersion: string): void;

  onSyncTimeReceived(dateTime: string): void;

  onSyncDisplayOffReceived(isDisplayOff: string): void;

  onMessageboardActivateReceived(serialKey: string): void;

  onWebsocketConnected(ipAddress: string): void;

  onWebsocketDisconnected(): void;
}
