import React, { CSSProperties } from 'react';
import { PlayerContextType, usePlayerEvent } from '../../context/PlayerContext';
import { ASSET_TEXT_ENDED } from '../../utils/events';

type Props = {
  style: CSSProperties;
  src: string;
  show: boolean;
  index: number;
};

export default function TextView({ style, src, show, index }: Props) {
  const { onPlayerEvent } = usePlayerEvent() as PlayerContextType;

  if (show) {
    onPlayerEvent(ASSET_TEXT_ENDED, { index });
  }

  // eslint-disable-next-line react/no-danger
  return <div style={style} dangerouslySetInnerHTML={{ __html: src }} />;
}
