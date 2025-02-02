import fs from 'fs';
import path from 'path';
import SystemInfo from './system-info';
import { sha256 } from '../util/crypto';

const usbEvents = require('detect-usb');

const generateMessageboardHash = () => {
  const { serialNumber } = SystemInfo.Instance.device;
  const usbSerialNum = `${serialNumber}board`;
  return sha256(usbSerialNum);
};

const checkActivationFile = (usbPath: string) => {
  const { serialNumber } = SystemInfo.Instance.device;
  const activationPath = path.join(usbPath, `${serialNumber}.txt`);
  if (!fs.existsSync(activationPath)) return false;

  try {
    const hashValue = fs.readFileSync(activationPath).toString();
    const msgBoardHash = generateMessageboardHash();
    return hashValue === msgBoardHash;
  } catch (error) {
    return false;
  }
};

export function startListening(callback: (isFound: boolean) => void) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  usbEvents.on('insert', async (device: any) => {
    if (device) {
      const { key: usbPath } = device.data;
      callback(checkActivationFile(usbPath));
    }
  });
  usbEvents.startListening();
}

export function stopListening(): void {
  usbEvents.stopListening();
}
