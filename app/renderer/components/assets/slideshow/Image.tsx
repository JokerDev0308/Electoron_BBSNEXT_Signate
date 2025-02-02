import React, { useEffect } from 'react';
import { SlideshowAsset } from '../../../../common/models/delivery';

type Props = {
  show: boolean;
  asset: SlideshowAsset;
  onEnded: () => void;
};

export default function Image({ show, asset, onEnded }: Props) {
  const { src, filePath, transitionType, duration } = asset;
  const srcPath = filePath || src;

  useEffect(() => {
    let timer: NodeJS.Timeout | null;
    if (show) {
      timer = setTimeout(onEnded, duration * 1000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };
  }, [show]);

  const visibility = !show ? 'Slideshow--hidden' : '';
  const transition = transitionType === 'fade in' ? 'Slideshow--fade' : '';
  const classes = `Slideshow__photo ${visibility} ${transition}`;

  return <img src={srcPath} alt="" className={classes} />;
}
