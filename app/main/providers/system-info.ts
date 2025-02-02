import si, {Systeminformation} from 'systeminformation';
import Device from '../models/device';
import writeLog from '../util/logger';
import LogType from '../../common/constants/log-type';

export default class SystemInfo {
  private static instance: SystemInfo;

  private deviceInfo: Device = new Device();

  private constructor() {
    // Prohibit instantiating using new keyword.
    // Use SystemInfo.Instance instead.
  }

  static get Instance(): SystemInfo {
    if (!SystemInfo.instance) {
      SystemInfo.instance = new SystemInfo();
    }
    return SystemInfo.instance;
  }

  get device(): Device {
    return this.deviceInfo;
  }

  static async initialize(): Promise<SystemInfo> {
    const sysInfo = SystemInfo.Instance;

    await sysInfo.initNetwork();

    //if (!sysInfo.device.ipAddress) {
    //  writeLog(LogType.ERROR, 'IPアドレスが空です。');
    //}

    const os = await si.osInfo();
    if (os) {
      sysInfo.deviceInfo.osVersion = os.kernel;
    }

    const uuid = await si.uuid();
    sysInfo.deviceInfo.serialNumber = uuid.os;

    const system = await si.system();
    if (system) {
      sysInfo.deviceInfo.manufacturer = system.manufacturer;
    }

    return sysInfo;
  }

  async initNetwork() {
    const netInterfaces = await si.networkInterfaces();
    const netInterface = netInterfaces?.find(
      (nif: Systeminformation.NetworkInterfacesData) =>
        nif.ip4 && !nif.internal && !nif.virtual
    );

    if (netInterface) {
      this.deviceInfo.macAddress = netInterface.mac;
      this.deviceInfo.ipAddress = netInterface.ip4;

      //
      console.log("IP address:" + netInterface.ip4)
    }
  }
}
