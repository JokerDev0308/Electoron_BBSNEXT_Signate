/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'reflect-metadata';
import path from 'path';
import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron';
import MenuBuilder from './menu';
import initMain from './main';
import { registerSystemRebootToTaskScheduler } from './main/util/system-reboot';
import registerAppMonitorTask from './main/util/app-monitor';
import registerChannels from './main/ipc';
import CursorToggleChannel from './main/ipc/channels/CursorToggleChannel';
import toastMessageChannel from './main/ipc/channels/ToastMessageChannel';
import SystemInfo from './main/providers/system-info';
import writeLog from './main/util/logger';
import LogType from './common/constants/log-type';
import { SERIAL_NUMBER_NOT_FOUND } from './common/constants/log-messages';
import { RESOURCES_PATH } from './common/constants/path';
import * as electron from 'electron';
import { getMessageboardStatus } from './main/providers/authentication';
import { MessageboardStatus } from './main/enums/messageboard';

let mainWindow: BrowserWindow | null = null;
let win: BrowserWindow;
let loginCallback: any;
let subWindow: BrowserWindow;

const isMainInstance = app.requestSingleInstanceLock();

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};
const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

const showSettingWindow = () => {

  if (!mainWindow) return;
  mainWindow.webContents.send('show_setting_window', {});

};


const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }


  // mainWindow = new BrowserWindow({
  //   show: false,
  //   width: 1024,
  //   height: 728,
  //   fullscreen: true,
  //   icon: getAssetPath('icon.png'),
  //   webPreferences:
  //     (process.env.NODE_ENV === 'development' ||
  //       process.env.E2E_BUILD === 'true') &&
  //     process.env.ERB_SECURE !== 'true'
  //       ? {
  //         nodeIntegration: true
  //       }
  //       : {
  //         preload: path.join(__dirname, 'dist/renderer.prod.js')
  //       }
  // });

  // Update webPreferences
  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    fullscreen: true,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,
      sandbox: false
    }
  });

  // Disable X-Frame-Options to allow embedding iframes from secure sites for editor and preview
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (detail, callback) => {
      const { responseHeaders } = detail;
      if (!responseHeaders) return;

      const xFrameOriginKey = Object.keys(responseHeaders).find(
        (header) => !!String(header).match(/^x-frame-options$/i)
      );
      if (xFrameOriginKey) {
        delete responseHeaders[xFrameOriginKey];
      }
      callback({
        cancel: false,
        responseHeaders: detail.responseHeaders,
        statusLine: detail.statusLine
      });
    }
  );

  mainWindow.webContents.on('new-window', (event, urlToOpen) => {
    // Prevent opening new windows from web page
    event.preventDefault();
    toastMessageChannel.send('別ウインドウは開くことができません');
    console.log(`url blocked in opening new window: ${urlToOpen}`);
  });

  mainWindow.webContents.on('context-menu', (event, { menuSourceType }) => {
    event.preventDefault();
    if (menuSourceType === 'mouse') {
      // 右クリックの処理
      if (mainWindow instanceof BrowserWindow) {
        // タイマー停止
        //mainWindow.webContents.send('idle-timer-pause-step2', {});
        //console.log('send idle-timer-pause');
        //
        const options: Electron.MessageBoxOptions = {
          type: 'question',  // none/info/error/question/warning
          title: '確認',
          message: '',
          detail: 'サイネージ画面の最小化または端末情報を表示しますか？',
          buttons: ['キャンセル', '端末情報', '最小化'],
          cancelId: -1,
          noLink: true
        };
        const selected: number = electron.dialog.showMessageBoxSync(mainWindow, options);
        if (selected === 1) {
          // 端末情報
          showSettingWindow();
        } else if (selected === 2) {
          // 最小化
          mainWindow.minimize();
          //const command = '(New-Object -ComObject shell.application).MinimizeAll()';
          //spawn(command, { shell: 'powershell' });
          // タイマー再開
          //mainWindow.webContents.send('idle-timer-resume-step2');
          //console.log('send idle-resume-pause');
        } else {
          // タイマー再開
          //mainWindow.webContents.send('idle-timer-resume-step2');
          //console.log('send idle-resume-pause');
        }

      }
    }
  });
  const url = `file://${__dirname}/app.html`;
  writeLog(LogType.INFO, `mainWindowで ${url} を開こうとしています`);
  mainWindow.loadURL(url);

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.maximize();
      mainWindow.show();
      // 開発者ツールを表示されたい場合
      //mainWindow.webContents.openDevTools();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();
  } else {
    mainWindow.removeMenu();
  }

  registerChannels(new CursorToggleChannel(mainWindow));
};

/**
 * Add event listeners...
 */

app.on('browser-window-focus', () => {
  globalShortcut.register('Esc', () => {
    console.log('globalShortcut.register Esc');

    if (!mainWindow) return;
    mainWindow.webContents.send('keydown_esc', {});

  });
  //
  globalShortcut.register('F11', () => {
    console.log('globalShortcut.register F11');
    if (!mainWindow) return;
    //
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  });
  //
  globalShortcut.register('Home', () => {
    console.log('globalShortcut.register Home');

    if (!mainWindow) return;
    mainWindow.webContents.send('keydown_home', {});
  });
  //
  globalShortcut.register('End', () => {
    console.log('globalShortcut.register End');

    if (!mainWindow) return;
    mainWindow.webContents.send('keydown_end', {});
  });

});

app.on('browser-window-blur', () => {
  globalShortcut.unregister('Esc');
  globalShortcut.unregister('F11');
  globalShortcut.unregister('Home');
  globalShortcut.unregister('End');
});

app.on('will-quit', () => {
  globalShortcut.unregister('Esc');
  globalShortcut.unregister('F11');
  globalShortcut.unregister('Home');
  globalShortcut.unregister('End');
});

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

if (isMainInstance) {
  app.setLoginItemSettings({
    openAtLogin: true
  });

  if (process.env.E2E_BUILD === 'true') {
    // eslint-disable-next-line promise/catch-or-return
    app.whenReady().then(createWindow);
  } else {
    // default locale to en-US
    app.commandLine.appendSwitch('lang', 'en-US');
    app.on('ready', async () => {
      const { device } = await SystemInfo.initialize();
      if (!device.serialNumber) {
        writeLog(LogType.ERROR, SERIAL_NUMBER_NOT_FOUND);
        app.quit();
      }

      // カスタムHTTPヘッダ
      const { session } = require('electron');
      session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        // メッセージボードを有効化しているwindows機のみを対象
        getMessageboardStatus().then((status) => {
          // 状態取得できた
          if (status.status === MessageboardStatus.ACTIVATED) {
            // メッセージボード有効
            details.requestHeaders['Keijiban-Next-Browser'] = '1';
          }else{
            // メッセージボード無効
            details.requestHeaders['Keijiban-Next-Browser'] = '0';
          }
          callback({ requestHeaders: details.requestHeaders });
        }).catch(() => {
          // 状態取得エラーの場合もメッセージボード無効として返す
          details.requestHeaders['Keijiban-Next-Browser'] = '0';
          callback({ requestHeaders: details.requestHeaders });
        });

      });

      //
      await createWindow();
      initMain(mainWindow);
      if (process.env.NODE_ENV === 'production') {
        registerAppMonitorTask();
        registerSystemRebootToTaskScheduler();
      }
    });
  }
} else {
  app.quit();
}

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();

});

ipcMain.on('quit-app', () => {
  app.exit();
});

ipcMain.on('activate-window', () => {

  console.log('Receive activate-window');

  if (mainWindow !== null) {
    mainWindow.focus();
  }
});

ipcMain.on('idle-timer-pause', function() {
  console.log('idle-timer-pause step1');
  //
  if (mainWindow !== null) {
    mainWindow.webContents.send('idle-timer-pause-step2', {});
    console.log('send idle-timer-pause');
  }

});
ipcMain.on('idle-timer-resume', function() {
  console.log('idle-timer-resume step1');
  //
  if (mainWindow !== null) {
    mainWindow.webContents.send('idle-timer-resume-step2', {});
    console.log('send idle-timer-resume');
  }
});

//
app.on('certificate-error', function(event, _webContents, url, error, certificate, callback) {
  event.preventDefault();
  if (mainWindow instanceof BrowserWindow) {
    electron.dialog.showMessageBox(mainWindow, {
      title: 'SSL証明書エラー',
      message: `この証明書を信頼しますか？\n【"${certificate.issuerName}"】`,
      detail: `URL: ${url}\nエラー: ${error}`,
      type: 'warning',
      buttons: [
        'はい',
        'いいえ'
      ],
      cancelId: 1
    }).then((res: Electron.MessageBoxReturnValue) => {
      if (res.response === 0) {
        callback(true);
      } else {
        callback(false);
      }
    });
  }
});

app.on('login', (event, _webContents, _request, _authInfo, callback) => {
  event.preventDefault();

  //
  if (mainWindow) win = mainWindow;
  subWindow = new BrowserWindow({
    width: 1024,
    height: 310,
    useContentSize: true,
    center: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,

    fullscreen: false,
    icon: getAssetPath('icon.png'),
    parent: win,
    modal: true,
    webPreferences: {
      nodeIntegration: false,
      enableRemoteModule: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'auth/preload.js')
    }
  });
  subWindow.setMenu(null);
  const url = `file://${__dirname}/auth/auth.html`;
  writeLog(LogType.INFO, `subWindowで ${url} を開こうとしています`);
  subWindow.loadURL(url);


  loginCallback = callback;
});
ipcMain.on('authorization', (_event, arg) => {
  if (arg.username && arg.password) {
    loginCallback(arg.username, arg.password);
  }
  subWindow.close();
});

//
process.on('uncaughtException', (err) => {

  writeLog(LogType.ERROR, `${err}`);

});
