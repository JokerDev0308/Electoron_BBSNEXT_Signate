import React, { CSSProperties } from 'react';
import { mimeFromPath } from '../../utils/util';
import { PlayerContextType, usePlayerEvent } from '../../context/PlayerContext';
import { PageAsset } from '../../../common/models/delivery';
import { ASSET_VIDEO_ENDED } from '../../utils/events';

type Props = {
  style: CSSProperties;
  asset: PageAsset;
  index: number;
  show: boolean;
  current: number;
  next: number;
};

export default function VideoView({
  style,
  asset,
  index,
  show,
  current,
  next,
}: Props) {
  const { onPlayerEvent } = usePlayerEvent() as PlayerContextType;
  const { src, filePath } = asset;
  const srcPath = filePath || src;

  const handleVideoAssetEnded = (e: React.SyntheticEvent) => {
    if (show) {
      // // Loop video
      const video = e.target as HTMLVideoElement;
      const playPromise = video.play();
      if (playPromise) {
        playPromise
          .then()
          // eslint-disable-next-line no-console
          .catch(console.error);
      }
      // // Starting Chrome 50, play() returns a Promise
      // const playPromise = video.play();
      // if (playPromise) {
      //   playPromise
      //     .then(() => {
      //       // Fire ASSET_VIDEO_ENDED after the video is playable
      //       // as workaround to prevent error like below when the page will transition:
      //       // Uncaught (in promise) DOMException: The play() request was interrupted by a call to pause().
      //       onPlayerEvent(ASSET_VIDEO_ENDED, {index});
      //       return undefined;
      //     })
      //     // eslint-disable-next-line no-console
      //     .catch(console.error);
      // } else {
      //   onPlayerEvent(ASSET_VIDEO_ENDED, {index});
      // }
      //
      // if (current === next || next === null) {
      //   // 単一ページの場合
      //   const video = e.target as HTMLVideoElement;
      //   const playPromise = video.play();
      //
      //   if (playPromise) {
      //     playPromise
      //       .then(() => {
      //         // Fire ASSET_VIDEO_ENDED after the video is playable
      //         // as workaround to prevent error like below when the page will transition:
      //         // Uncaught (in promise) DOMException: The play() request was interrupted by a call to pause().
      //         onPlayerEvent(ASSET_VIDEO_ENDED, {index, video});
      //       })
      //       // eslint-disable-next-line no-console
      //       .catch(console.error);
      //   } else {
      //     onPlayerEvent(ASSET_VIDEO_ENDED, {index, video});
      //   }
      //   return undefined;
      // }

      onPlayerEvent(ASSET_VIDEO_ENDED, { index, video });
    }
  };

  /* eslint jsx-a11y/media-has-caption: off */
  return (
    <div style={style} className="player-video">
      <video
        width="100%"
        height="100%"
        autoPlay
        onEnded={(e) => handleVideoAssetEnded(e)}
        src={`${srcPath}`}
      />
    </div>
  );
}
