import React, {CSSProperties, Fragment, useState} from 'react';
import './Slideshow.css';
import {SlideshowAsset} from '../../../../common/models/delivery';
import {
  PlayerContextType,
  usePlayerEvent,
} from '../../../context/PlayerContext';
import {ASSET_SLIDESHOW_ENDED} from '../../../utils/events';
import SlideWeb from './Web';
import SlideImage from './Image';
import SlideVideo from './Video';

type Props = {
  style: CSSProperties;
  src: SlideshowAsset[];
  index: number;
  show: boolean;
};

const renderAsset = (
  asset: SlideshowAsset,
  show: boolean,
  loopVideo: boolean,
  onAssetEnded: () => void,
  slideCount: number
) => {
  let elem;
  switch (asset.type) {
    case 'photo':
      elem = <SlideImage asset={asset} show={show} onEnded={onAssetEnded}/>;
      break;
    case 'video':
      elem = show ? (
        <SlideVideo asset={asset} onEnded={onAssetEnded} loop={loopVideo}/>
      ) : null;
      break;
    case 'web':
      elem = show ? <SlideWeb asset={asset} onEnded={onAssetEnded} slideCount={slideCount}/> : null;
      break;
    default:
      elem = <div>UNSUPPORTED</div>;
  }

  return elem;
};

export default function Slideshow({style, src, index, show}: Props) {
  const [slideIndex, setSlideIndex] = useState(0);
  const {onPlayerEvent} = usePlayerEvent() as PlayerContextType;

  const onAssetEnded = () => {
    if (slideIndex === src.length - 1) {
      // 終端に到達
      setSlideIndex(0);
      onPlayerEvent(ASSET_SLIDESHOW_ENDED, {index});
    } else {
      // 途中ページ
      setSlideIndex(slideIndex + 1);
    }
  };
  const onAssetBack = () => {
    if (slideIndex === 0) {
      // 先頭から最後のタブへ
      setSlideIndex(src.length - 1);
    } else {
      // 途中ページ
      setSlideIndex(slideIndex - 1);
    }
  }

  const isShow = (i: number) => show && slideIndex === i;
  const loopVideo = src.length === 1;

  return (
    <div style={style} className='slideShow-wrapper'>
      <div className="overlayLayer-left" onClick={onAssetBack}></div>
      <div className="overlayLayer-right" onClick={onAssetEnded}></div>
      {src.map((asset, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Fragment key={`slide-${i}`}>
          {renderAsset(asset, isShow(i), loopVideo, onAssetEnded, src.length)}
        </Fragment>
      ))}
    </div>
  );
}
