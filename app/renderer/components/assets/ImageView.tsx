import React, { CSSProperties } from 'react';
import { PlayerContextType, usePlayerEvent } from '../../context/PlayerContext';
import { PageAsset } from '../../../common/models/delivery';
import { ASSET_PHOTO_ENDED } from '../../utils/events';

type Props = {
  style: CSSProperties;
  asset: PageAsset;
  show: boolean;
  index: number;
};

export default function ImageView({ style, asset, show, index }: Props) {
  const { onPlayerEvent } = usePlayerEvent() as PlayerContextType;
  const { src, filePath } = asset;
  const srcPath = filePath || src;

  if (show) {
    onPlayerEvent(ASSET_PHOTO_ENDED, { index });
  }

  return (
    <div style={style}>
      <img src={`${srcPath}`} alt="" width="100%" height="100%" />
    </div>
  );
}
