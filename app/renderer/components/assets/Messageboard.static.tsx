import React, { CSSProperties } from 'react';
import { PageAsset } from '../../../common/models/delivery';
import Port from '../../../common/constants/port';
import { PlayerContextType, usePlayerEvent } from '../../context/PlayerContext';
import { ASSET_WEB_ENDED } from '../../utils/events';

const port = Port.SERVER_PORT;

type Props = {
  style: CSSProperties;
  asset: PageAsset;
  show: boolean;
  index: number;
};

export default function MessageboardStatic({
  style,
  asset,
  show,
  index,
}: Props) {
  const { onPlayerEvent } = usePlayerEvent() as PlayerContextType;

  const { pageCount, pageTransition, toneEnabled, messageboardType, dispTitle, messageCount } = asset;
  const url = `http://localhost:${port}?pageCount=${pageCount}&pageTransition=${pageTransition}&toneEnabled=${toneEnabled}&messageboardType=${messageboardType}&dispTitle=${dispTitle}&messageCount=${messageCount}`;

  if (show) {
    onPlayerEvent(ASSET_WEB_ENDED, { index });
  }

  return (
    <div style={style}>
      <iframe
        id="msgBoard-iframe"
        src={url}
        width="100%"
        height="100%"
        frameBorder="0"
        sandbox="allow-forms allow-popups allow-pointer-lock allow-same-origin allow-scripts"
      />
    </div>
  );
}
