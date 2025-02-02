import React from 'react';
import Poster from '../../../images/poster.png';
import { mimeFromPath } from '../../../utils/util';
import { SlideshowAsset } from '../../../../common/models/delivery';

type Props = {
  asset: SlideshowAsset;
  onEnded: () => void;
  loop: boolean;
};

export default function Video({ asset, onEnded, loop }: Props) {
  const { src, filePath, transitionType } = asset;
  const srcPath = filePath || src;

  const ended = (e: React.SyntheticEvent) => {
    if (!loop) {
      onEnded();
      return;
    }

    const video = e.target as HTMLVideoElement;
    const playPromise = video.play();
    // Prevent error:
    // Uncaught (in promise) DOMException: The play() request was interrupted by a call to pause().
    if (playPromise) {
      playPromise
        .then(() => onEnded())
        // eslint-disable-next-line no-console
        .catch(console.error);
    } else {
      onEnded();
    }
  };

  const transition = transitionType === 'fade in' ? 'Slideshow--fade' : '';

  /* eslint jsx-a11y/media-has-caption: off */
  return (
    <div className="Slideshow__video">
      <video
        width="100%"
        height="100%"
        autoPlay
        poster={Poster}
        onEnded={ended}
        className={transition}
        src={srcPath}
      />
    </div>
  );
}
