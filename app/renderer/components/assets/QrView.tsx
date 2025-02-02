import React, { CSSProperties } from 'react';
import { PlayerContextType, usePlayerEvent } from '../../context/PlayerContext';
import { ASSET_PHOTO_ENDED } from '../../utils/events';

type Props = {
  style: CSSProperties;
  qrImage: string;
  show: boolean;
  index: number;
};

export default function QrView({ style, qrImage, show, index }: Props) {
  const { onPlayerEvent } = usePlayerEvent() as PlayerContextType;

  if (show) {
    onPlayerEvent(ASSET_PHOTO_ENDED, { index });
  }

  return (
    <div style={style}>
      <img src={qrImage} alt="" width="100%" height="100%" />
    </div>
  );
}
