import { ipcMain } from 'electron';
import { IpcChannel } from './IpcChannel';

export default function registerChannels(...channels: IpcChannel[]) {
  channels.forEach((channel) => {
    ipcMain.on(channel.name, (event, args) => channel.handle(event, args));
  });
}
