import React, { useEffect, useState } from 'react';
import { hot } from 'react-hot-loader/root';
import { Route, RouteChildrenProps, RouteProps, Router } from 'react-router-dom';
import { createHashHistory } from 'history';
import * as electron from 'electron';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import { toast } from 'react-toastify';
import Player from '../components/player/Player';
import { ASSET_PHOTO_ENDED, ASSET_SLIDESHOW_ENDED, ASSET_TEXT_ENDED, ASSET_VIDEO_ENDED, ASSET_WEB_ENDED, IFRAME_HTML_LOADED, MOVE_TO_FIRST_PAGE, MOVE_TO_LAST_PAGE, MOVE_TO_NEXT_PAGE, MOVE_TO_PAGE, MOVE_TO_PREV_PAGE, PAGE_ENTERED, PAGE_TRANSITION_WITH_TIME } from '../utils/events';
import { Page } from '../../common/models/delivery';
import ActionType from '../../common/constants/action-type';
import AssetType from '../../common/constants/asset-type';
import { PageEventParam, PlayerContext } from '../context/PlayerContext';
import { FetchContentRequest } from '../../common/ipc/request/FetchContentRequest';
import { FetchContentResponse } from '../../common/ipc/response/FetchContentResponse';
import { ToastMessageRequest } from '../../common/ipc/request/ToastMessageRequest';
import { ToastMessageResponse } from '../../common/ipc/response/ToastMessageResponse';
import { DB_PATH, RESOURCES_PATH } from '../../common/constants/path';
import writeLog from '../../main/util/logger';
import LogType from '../../common/constants/log-type';
import { spawnSync } from 'child_process';
import path from 'path';
import { IdleTimerAPI } from 'react-idle-timer';

const history = createHashHistory();
let add_keydown = false;
let _content: any = null;

interface PageAssetsState {
  [key: number]: boolean;

  length: number;
}

let currentPage: Page | undefined;
let currentPageAssetsState: PageAssetsState = [];

const hasAllAssetsPlayed = (assetsState: PageAssetsState) => {
  for (let i = 0; i < assetsState.length; i += 1) {
    if (!assetsState[i]) {
      return false;
    }
  }
  return true;
};

const handlePageEntered = (page: Page) => {
  currentPage = page;
  currentPageAssetsState = {
    length: page.assets.length
  };
};

const handlePageTransition = ({ actionPage }: Page) => {
  history.push(`/${actionPage}`);
};

const replayVideo = (video: any) => {
  video.pause();
  video.currentTime = 0;
  video.play();
};

const handleAssetEnded = (index: number, video: any) => {
  if (!currentPage) return;
  const assetType = currentPage.assets[index].type;

  if (currentPage.actionType === ActionType.AUTO_TRANSITION) {
    currentPageAssetsState[index] = true;

    if (
      (assetType === AssetType.VIDEO || assetType === AssetType.SLIDESHOW) &&
      hasAllAssetsPlayed(currentPageAssetsState)
    ) {
      // 全ての再生が完了
      handlePageTransition(currentPage);
    } else if (assetType === AssetType.VIDEO && video) {
      // 全ての再生が終わっていないのでリプレイ
      replayVideo(video);
    }
  } else if (currentPage.actionType === null) {
    // ページ遷移なし = 単一ページ
    if (assetType === AssetType.VIDEO && video) {
      // リプレイ
      replayVideo(video);
    }
  }
};

const handlePageEvents = (e: string, params: PageEventParam) => {
  if (e === PAGE_ENTERED) {
    if (params.page) {
      handlePageEntered(params.page);
    }
  } else if (e === PAGE_TRANSITION_WITH_TIME) {
    if (params.page) {
      handlePageTransition(params.page);
    }
  } else if (e === ASSET_VIDEO_ENDED || e === ASSET_PHOTO_ENDED || e === ASSET_SLIDESHOW_ENDED || e === ASSET_WEB_ENDED || e === ASSET_TEXT_ENDED) {
    if (params.index !== undefined) {
      handleAssetEnded(params.index, params.video);
    }
  } else if (e === MOVE_TO_PREV_PAGE) {
    // const {pages} = _content;
    // const page = pages[index];
    // console.log(page)

    const current_number = currentPage?.number ? currentPage?.number : 1;
    const page = findPage(current_number - 1);
    if (page) {
      console.log('MOVE_TO_PREV_PAGE ' + page.number);
      history.push(`/${page.number}`);
    }

  } else if (e === MOVE_TO_NEXT_PAGE) {
    const current_number = currentPage?.number ? currentPage?.number : 1;
    const page = findPage(current_number + 1);
    if (page) {
      console.log('MOVE_TO_NEXT_PAGE ' + page.number);
      history.push(`/${page.number}`);
    }

  } else if (e === MOVE_TO_PAGE) {
    const page = findPage(params.pageNumber ? params.pageNumber : 1);
    if (page) {
      console.log('MOVE_TO_PAGE ' + page.number);
      history.push(`/${page.number}`);
    }

  } else if (e === MOVE_TO_FIRST_PAGE) {
    const page = findPage(1);
    if (page) {
      console.log('MOVE_TO_LAST_PAGE ' + page.number);
      history.push(`/${page.number}`);
    }
  } else if (e === MOVE_TO_LAST_PAGE) {
    const { pages } = _content;
    const page = findPage(pages.length);
    if (page) {
      console.log('MOVE_TO_LAST_PAGE ' + page.number);
      history.push(`/${page.number}`);
    }

  } else if (e === IFRAME_HTML_LOADED) {
    focus();
  } else {
    throw new Error(`Unknown event: ${e}`);
  }
};

function findPage(pageNumber: number) {
  const { pages } = _content;
  for (const k in pages) {
    const page = pages[k];
    if (page.number === pageNumber) {
      return page;
    }
  }
  return null;
}

const renderPlayer = (
  width: number,
  height: number,
  page: Page,
  routeProps: RouteChildrenProps
) => {
  return (
    <Player
      width={width}
      height={height}
      page={page}
      key={page.number}
      show={routeProps.match != null}
      onTouchMouseEvent={onTouchMouseEvent}
    />
  );
};

const createRoutes = (pages: Page[] = [], width: number, height: number) => {
  return pages.map((page, index) => ({
    path: `/${page.number}`,
    children: (routeProps: RouteChildrenProps) =>
      renderPlayer(width, height, page, routeProps),
    key: `page-${page.number}-${index}`
  }));
};

function onEscKey() {
  handlePageEvents(IFRAME_HTML_LOADED, {});
}

function onHomeKey() {
  console.log('onHomeKey');
  handlePageEvents(MOVE_TO_FIRST_PAGE, {});
}

function onEndKey() {
  console.log('onEndKey');
  handlePageEvents(MOVE_TO_LAST_PAGE, {});
}

let lastTouchClick: string | null = null;
let touchClickTimer: any | null = null;

function onTouchMouseEvent(caller: string, callback: any) {

  if (lastTouchClick === caller) {
    //前回の方式と同じ
    console.log('前回から1000ms以内だが同一方式のため実行する');
    clearTouchMouseTimer();

    // タイマー再作成。この時点から1000ms後にタイマークリア
    lastTouchClick = caller;
    touchClickTimer = setTimeout(clearTouchMouseTimer, 1000);
    console.log('タイマー再作成:', touchClickTimer);

    // 関数実行
    console.log('関数実行');
    callback();

    return;
  } else if (touchClickTimer) {
    //
    console.log('前回から1000ms以内のため無視');
    return;
  }
  // 方式を記憶・タイマークリアは1000ms後
  lastTouchClick = caller;
  touchClickTimer = setTimeout(clearTouchMouseTimer, 1000);
  console.log('タイマー作成:', touchClickTimer);

  // 関数実行
  console.log('関数実行');
  callback();

}

function clearTouchMouseTimer() {
  console.log('タイマークリア：', touchClickTimer);
  if (touchClickTimer) {
    clearTimeout(touchClickTimer);
  }

  lastTouchClick = null;
  touchClickTimer = undefined;
}

type Props = {
  idleTimer: IdleTimerAPI;
};

let timer: IdleTimerAPI;
ipcRenderer.on('idle-timer-pause-step2', function() {
  console.log('idle-timer-pause-step2');
  timer.pause();
});
ipcRenderer.on('idle-timer-resume-step2', function() {
  console.log('idle-timer-resume-step2');
  timer.resume();
});

function App({ idleTimer }: Props) {
  timer = idleTimer;
  console.log(timer);

  const [routes, setRoutes] = useState<RouteProps[]>([]);

  currentPage = undefined;
  currentPageAssetsState = [];

  useEffect(() => {
    const handleFetch = (_: IpcRendererEvent, res: FetchContentResponse) => {
      const { content } = res;
      _content = content;

      if (content) {
        const { pages, width, height } = content;
        setRoutes(createRoutes(pages, width, height));
      } else {
        setRoutes([]);
      }

      if (history.location.pathname === '/1') {
        // This is to force reload the first page
        history.push('/0');
      }
      history.push('/1');
    };

    const handleToast = (_: IpcRendererEvent, res: ToastMessageResponse) => {
      toast.dark(res.message);
    };

    const fetchResponseChannel = 'fetch-content-response';
    const fetchRequest: FetchContentRequest = {
      responseChannel: fetchResponseChannel
    };
    ipcRenderer.on(fetchResponseChannel, handleFetch);
    ipcRenderer.send('fetch-content', fetchRequest);

    const toastResponseChannel = 'toast-message-response';
    const toastRequest: ToastMessageRequest = {
      responseChannel: toastResponseChannel
    };
    ipcRenderer.on(toastResponseChannel, handleToast);
    ipcRenderer.send('toast-message', toastRequest);

    //
    ipcRenderer.on('keydown_esc', onEscKey);
    ipcRenderer.on('keydown_home', onHomeKey);
    ipcRenderer.on('keydown_end', onEndKey);
    //

    //
    ipcRenderer.on('show_setting_window', showSettingScreen);

    return () => {
      ipcRenderer.off(fetchResponseChannel, handleFetch);
      ipcRenderer.off(toastResponseChannel, handleToast);
      ipcRenderer.off('keydown_home', onEscKey);
      ipcRenderer.off('keydown_home', onHomeKey);
      ipcRenderer.off('keydown_end', onEndKey);
    };
  }, []);


  ///////////////////
  if (!add_keydown) {
    add_keydown = true;
    document.addEventListener('keydown', handleKeydown, false);
  }

  async function showSettingScreen(event: IpcRendererEvent, res: object) {
    //
    const appPath = electron.remote.app.getAppPath();
    const is_dev = process.env.NODE_ENV === 'development';
    const command: string = is_dev ?
      path.join(appPath, '..\\resources\\stb_setting\\elecom-windows-setting.exe') :
      path.join(RESOURCES_PATH, 'stb_setting\\elecom-windows-setting.exe');
    //writeLog(LogType.INFO, `外部ファイル起動： ${command} ${DB_PATH} `);
    // //
    // ipcRenderer.send('idle-timer-pause');

    //
    const child = spawnSync(command, [DB_PATH]);

    // 設定画面から戻ってきたら 自分自身をアクティブにする
    ipcRenderer.send('activate-window');

    //
    ipcRenderer.send('idle-timer-resume');

  }

  function handleKeydown(e: KeyboardEvent) {
    e.preventDefault();

    //
    if (_content && _content.use_remocon !== '1') {
      // リモコンを使用しない
      return;
    }

    const keyCode = e.keyCode;
    switch (keyCode) {
      case 37:
      case 38:
        // ↑または←
        handlePageEvents(MOVE_TO_PREV_PAGE, {});
        e.preventDefault();
        break;
      case 39:
      case 40:
        // ↓または→
        handlePageEvents(MOVE_TO_NEXT_PAGE, {});
        e.preventDefault();
        break;

      case 0x31:
      case 0x32:
      case 0x33:
      case 0x34:
      case 0x35:
      case 0x36:
      case 0x37:
      case 0x38:
      case 0x39:
        // 数字の 1～9
        handlePageEvents(MOVE_TO_PAGE, { pageNumber: keyCode - 0x30 });
        e.preventDefault();
        break;

      case 0x61:
      case 0x62:
      case 0x63:
      case 0x64:
      case 0x65:
      case 0x66:
      case 0x67:
      case 0x68:
      case 0x69:
        // 数字の 1～9(テンキー)
        handlePageEvents(MOVE_TO_PAGE, { pageNumber: keyCode - 0x60 });
        e.preventDefault();
        break;


      default:
        break;

    }
  }

  ///////////////////
  console.log(routes);
  return (
    <PlayerContext.Provider value={{ onPlayerEvent: handlePageEvents }}>
      <Router history={history}>
        <Route path='/reload' key='reload' />

        {routes.map((route) => (
          /* eslint react/jsx-props-no-spreading: off, react/jsx-key: off */
          <Route {...route} exact />
        ))}
      </Router>
    </PlayerContext.Provider>
  );
}

export default hot(App);
