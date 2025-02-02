import { BrowserWindow, IpcMainEvent } from 'electron';
import { IpcChannel } from '../IpcChannel';

export default class CursorToggleChannel implements IpcChannel {
  readonly name = 'toggle-cursor';

  private mainWindow: BrowserWindow;

  private cssKey: string = '';

  private isShown = true;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  handle = async (_: IpcMainEvent) => {
    if (this.isShown) {
      await this.hideCursor();
    } else {
      await this.showCursor();
    }
  };

  private showCursor = async () => {
    //
    // if (this.cssKey === '') {
    //   // 参照なし
    //   return;
    // }

    await this.mainWindow.webContents.removeInsertedCSS(this.cssKey);
    console.log('CursorToggleChannel showCursor', this.cssKey);

    this.cssKey = '';
    this.isShown = true;
  };

  private hideCursor = async () => {
    //
    // if (this.cssKey !== '') {
    //   // 参照ありの場合は処理しない
    //   return;
    // }
    //
    const css = '* { cursor: none !important; }';
    this.cssKey = await this.mainWindow.webContents.insertCSS(css);
    this.isShown = false;
    //
    console.log('CursorToggleChannel hideCursor', this.cssKey);
  };
}
