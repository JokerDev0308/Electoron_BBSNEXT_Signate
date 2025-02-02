import { version } from '../../package.json';

export default class Device {
  sender = 'elecom-windows-signage';

  signageVersion = version;

  serialNumber!: string;

  macAddress!: string;

  ipAddress!: string;

  manufacturer!: string;

  osVersion!: string;
}
