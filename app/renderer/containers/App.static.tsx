import React, { useEffect, useState } from 'react';
import { hot } from 'react-hot-loader/root';
import {
  Router,
  Route,
  RouteProps,
  RouteChildrenProps,
} from 'react-router-dom';
import { createHashHistory } from 'history';
import PlayerStatic from '../components/player/Player.static';
import {
  ASSET_PHOTO_ENDED,
  ASSET_SLIDESHOW_ENDED,
  ASSET_TEXT_ENDED,
  ASSET_VIDEO_ENDED,
  ASSET_WEB_ENDED,
  PAGE_ENTERED,
  PAGE_TRANSITION_WITH_TIME,
} from '../utils/events';
import { Content, Page } from '../../common/models/delivery';
import ActionType from '../../common/constants/action-type';
import AssetType from '../../common/constants/asset-type';
import { PlayerContext, PageEventParam } from '../context/PlayerContext';

interface PageAssetsState {
  [key: number]: boolean;
  length: number;
}

type Props = {
  content: Content;
};

function AppStatic({ content }: Props) {
  const [routes, setRoutes] = useState<RouteProps[]>([]);

  const history = createHashHistory();
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
      length: page.assets.length,
    };
  };

  const handlePageTransition = ({ actionPage }: Page) => {
    history.push(`/${actionPage}`);
  };

  const handleAssetEnded = (index: number) => {
    if (!currentPage) return;
    if (currentPage.actionType === ActionType.AUTO_TRANSITION) {
      if (currentPageAssetsState[index]) return;
      currentPageAssetsState[index] = true;

      if (
        (currentPage.assets[index].type === AssetType.VIDEO ||
          currentPage.assets[index].type === AssetType.SLIDESHOW) &&
        hasAllAssetsPlayed(currentPageAssetsState)
      ) {
        handlePageTransition(currentPage);
      }
    }
  };

  const handlePageEvents = (e: string, params: PageEventParam) => {
    switch (e) {
      case PAGE_ENTERED:
        if (params.page) {
          handlePageEntered(params.page);
        }
        break;
      case PAGE_TRANSITION_WITH_TIME:
        if (params.page) {
          handlePageTransition(params.page);
        }
        break;
      case ASSET_VIDEO_ENDED:
      case ASSET_PHOTO_ENDED:
      case ASSET_SLIDESHOW_ENDED:
      case ASSET_WEB_ENDED:
      case ASSET_TEXT_ENDED:
        if (params.index !== undefined) {
          handleAssetEnded(params.index);
        }
        break;
      default:
        throw new Error(`Unknown event: ${e}`);
    }
  };

  const renderPlayer = (
    width: number,
    height: number,
    page: Page,
    routeProps: RouteChildrenProps
  ) => {
    return (
      <PlayerStatic
        width={width}
        height={height}
        page={page}
        key={page.number}
        show={routeProps.match != null}
      />
    );
  };

  const createRoutes = (pages: Page[] = [], width: number, height: number) => {
    return pages.map((page, index) => ({
      path: `/${page.number}`,
      children: (routeProps: RouteChildrenProps) =>
        renderPlayer(width, height, page, routeProps),
      key: `page-${page.number}-${index}`,
    }));
  };

  useEffect(() => {
    const { pages, width, height } = content;
    setRoutes(createRoutes(pages, width, height));
    history.push('/1');
  }, [content]);

  return (
    <PlayerContext.Provider value={{ onPlayerEvent: handlePageEvents }}>
      <Router history={history}>
        {routes.map((route) => (
          /* eslint react/jsx-props-no-spreading: off, react/jsx-key: off */
          <Route {...route} exact />
        ))}
      </Router>
    </PlayerContext.Provider>
  );
}

export default hot(AppStatic);
