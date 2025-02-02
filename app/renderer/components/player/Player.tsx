import React, { Fragment, memo, useEffect } from 'react';
import ContentType from '../../../common/constants/asset-type';
import { calculatePlayerSize, getStyle } from '../../utils/util';
import { PAGE_ENTERED, PAGE_TRANSITION_WITH_TIME } from '../../utils/events';
import './Player.css';
import Slideshow from '../assets/slideshow/Slideshow';
import { Page, PageAsset, SlideshowAsset } from '../../../common/models/delivery';
import ImageView from '../assets/ImageView';
import VideoView from '../assets/VideoView';
import WebView from '../assets/WebView';
import TextView from '../assets/TextView';
import QrView from '../assets/QrView';
import Messageboard from '../assets/Messageboard';
import { PlayerContextType, usePlayerEvent } from '../../context/PlayerContext';
import ActionType from '../../../common/constants/action-type';
import DisplayDate from '../assets/DisplayDate';
import CountDate from '../assets/CountDate';
import DisplayTime from '../assets/DisplayTime';
import moment from 'moment';

type Props = {
  width: number;
  height: number;
  page: Page;
  show: boolean;
  onTouchMouseEvent: any;
};
const renderAsset = (
  playerWidth: number,
  playerHeight: number,
  pageWidth: number,
  pageHeight: number,
  asset: PageAsset,
  index: number,
  show: boolean,
  current: number,
  next: number,
  dateFormat: string,
  timeFormat: string,
  countFormat: string,
  countType: string,
  baseDate: string,
  weekFormat: string,
  qrImage: string,
  key: string
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
        <VideoView
          style={style}
          asset={asset}
          index={index}
          show={show}
          current={current}
          next={next}
        />
      ) : null;
      break;
    case ContentType.WEB:
      elem = show ? (
        <WebView src={src as string} style={style} show={show} index={index} />
      ) : null;
      break;
    case ContentType.MESSAGE_BOARD:
      elem = show ? (
        <Messageboard style={style} asset={asset} show={show} index={index} />
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
        <QrView style={style} qrImage={qrImage} show={show} index={index} />
      );
      break;

    case ContentType.DISPLAY_DATE:
      elem = show ? (
        <DisplayDate
          keyValue={key}
          style={style}
          src={src as string}
          show={show}
          index={index}
          dateFormat={dateFormat}
          weekFormat={weekFormat}
        />
      ) : null;
      break;

    case ContentType.COUNT_DATE:
      elem = show ? (
        <CountDate
          keyValue={key}
          style={style}
          src={src as string}
          show={show}
          index={index}
          countFormat={countFormat}
          countType={countType}
          baseDate={baseDate}
        />
      ) : null;
      break;

    case ContentType.DISPLAY_TIME:
      elem = show ? (
        <DisplayTime
          keyValue={key}
          style={style}
          src={src as string}
          show={show}
          index={index}
          timeFormat={timeFormat}
        />
      ) : null;
      break;

    default:
      elem = <div style={style}>UNSUPPORTED</div>;
  }

  return elem;
};

function Player({ show, page, width, height, onTouchMouseEvent }: Props) {
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
        if (page.number === page.actionPage) {
          // 今の画面と行き先の画面が同じ。
          console.log('今の画面と行き先の画面が同じ');
          reload(page.number);
          return;
        }


        onPlayerEvent(PAGE_TRANSITION_WITH_TIME, { page });
      }, actionDuration * 1000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [show]);

  const { playerWidth, playerHeight } = calculatePlayerSize(width, height);

  const { assets, bgColor } = page;

  const style = {
    backgroundColor: bgColor,
    width: `${playerWidth}px`,
    height: `${playerHeight}px`,
    display: `${show ? 'block' : 'none'}`
  };

  const reload = (num: number | undefined) => {
    //
    const origin = location.origin;
    const pathname = location.pathname;
    //
    location.href = origin + pathname + '#/reload';
    setTimeout(function() {
      location.href = origin + pathname + '#/' + num;
    });
  };
  const moveTo = (item: PageAsset) => {
    //
    const origin = location.origin;
    const pathname = location.pathname;
    //
    location.href = origin + pathname + '#/' + item.link;
  };


  return (
    <div className='container' data-tid='player' style={style}>
      {assets.map((item, index) => {
        const dt = moment().utc().valueOf();
        const key = `asset-${page.number}-${index}-${dt}`;
        const elem = renderAsset(
          playerWidth,
          playerHeight,
          width,
          height,
          item,
          index,
          show,
          page.number,
          page.actionPage || 0,
          item.dateFormat,
          item.timeFormat,
          item.countFormat,
          item.countType,
          item.baseDate,
          item.weekFormat,
          item.qrImage,
          key
        );
        if (item.linkType === 'page' && item.link) {
          if (page.number === item.link) {
            // 同一ページへ
            return <span key={key}
                         onMouseDown={() => {

                           // reload(item.link);
                           console.log('onMouseDown reload');
                           onTouchMouseEvent('mouse', function() {
                             reload(item.link);
                           });
                         }}
                         onTouchStart={() => {

                           // reload(item.link);
                           console.log('onTouchStart reload');
                           onTouchMouseEvent('touch', function() {
                             reload(item.link);
                           });
                         }}
            >
              {elem}
            </span>;

          } else {
            // 他のページへ
            return <span key={key}
                         onMouseDown={() => {

                           // moveTo(item);
                           console.log('onMouseDown moveTo');
                           onTouchMouseEvent('mouse', function() {
                             moveTo(item);
                           });

                         }}
                         onTouchStart={() => {

                           // moveTo(item);
                           console.log('onTouchStart moveTo');
                           onTouchMouseEvent('touch', function() {
                             moveTo(item);
                           });

                         }}
            >
              {elem}
            </span>;
          }
        } else {
          return <Fragment key={key}>{elem}</Fragment>;

        }


      })}
    </div>
  );


}

export default memo(Player);
