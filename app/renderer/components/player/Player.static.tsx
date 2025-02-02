import React, { Fragment, memo, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ContentType from '../../../common/constants/asset-type';
import { calculatePlayerSize, getStyle } from '../../utils/util';
import { PAGE_ENTERED, PAGE_TRANSITION_WITH_TIME } from '../../utils/events';
import './Player.css';
import Slideshow from '../assets/slideshow/Slideshow';
import {
  PageAsset,
  Page,
  SlideshowAsset,
} from '../../../common/models/delivery';
import ImageView from '../assets/ImageView';
import VideoView from '../assets/VideoView';
import WebView from '../assets/WebView';
import TextView from '../assets/TextView';
import QrView from '../assets/QrView';
import MessageboardStatic from '../assets/Messageboard.static';
import { PlayerContextType, usePlayerEvent } from '../../context/PlayerContext';
import ActionType from '../../../common/constants/action-type';

type Props = {
  width: number;
  height: number;
  page: Page;
  show: boolean;
};

const renderAsset = (
  playerWidth: number,
  playerHeight: number,
  pageWidth: number,
  pageHeight: number,
  asset: PageAsset,
  index: number,
  show: boolean,
  qrImage: string
) => {
  const { type, src } = asset;
  const style = getStyle(
    asset,
    pageWidth,
    pageHeight,
    playerWidth,
    playerHeight
  );

  let elem;
  switch (type) {
    case ContentType.PHOTO:
      elem = (
        <ImageView style={style} asset={asset} show={show} index={index} />
      );
      break;
    case ContentType.VIDEO:
      elem = show ? (
        <VideoView style={style} asset={asset} index={index} show={show} />
      ) : null;
      break;
    case ContentType.WEB:
      elem = show ? (
        <WebView src={src as string} style={style} show={show} index={index} />
      ) : null;
      break;
    case ContentType.MESSAGE_BOARD:
      elem = show ? (
        <MessageboardStatic
          style={style}
          asset={asset}
          show={show}
          index={index}
        />
      ) : null;
      break;
    case ContentType.SLIDESHOW:
      elem = show ? (
        <Slideshow
          style={style}
          src={src as SlideshowAsset[]}
          show={show}
          index={index}
        />
      ) : null;
      break;
    case ContentType.TEXT:
    case ContentType.TEXT_V:
      elem = (
        <TextView style={style} src={src as string} show={show} index={index} />
      );
      break;
    case ContentType.SCROLL_TEXT:
    case ContentType.SCROLL_TEXT_V:
      elem = show ? (
        <TextView style={style} src={src as string} show={show} index={index} />
      ) : null;
      break;
    case ContentType.QR:
      elem = (
        <QrView style={style} qrImage={qrImage} show={show} index={index}/>
      );
      break;
    default:
      elem = <div>UNSUPPORTED</div>;
  }

  return elem;
};

function PlayerStatic({ show, page, width, height }: Props) {
  const { onPlayerEvent } = usePlayerEvent() as PlayerContextType;

  if (show) {
    onPlayerEvent(PAGE_ENTERED, { page });
  }

  useEffect(() => {
    let timer: NodeJS.Timeout | null;
    const { actionType, actionDuration } = page;
    const transitionWithTime = actionType === ActionType.TRANSITION_WITH_TIME;

    if (show && transitionWithTime && actionDuration) {
      timer = setTimeout(() => {
        onPlayerEvent(PAGE_TRANSITION_WITH_TIME, { page });
      }, actionDuration * 1000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [show]);

  const { playerWidth, playerHeight } = useMemo(() => {
    return calculatePlayerSize(width, height);
  }, []);

  const { assets, bgColor } = page;

  const style = {
    backgroundColor: bgColor,
    width: `${playerWidth}px`,
    height: `${playerHeight}px`,
    display: `${show ? 'block' : 'none'}`,
  };

  return (
    <div className="container" data-tid="player" style={style}>
      {assets.map((item, index) => {
        const key = `asset-${page.number}-${index}`;
        const elem = renderAsset(
          playerWidth,
          playerHeight,
          width,
          height,
          item,
          index,
          show
        );
        return item.linkType === 'page' ? (
          <Link to={`/${item.link}`} key={key}>
            {elem}
          </Link>
        ) : (
          <Fragment key={key}>{elem}</Fragment>
        );
      })}
    </div>
  );
}

export default memo(PlayerStatic);
