import React, { useEffect, useState } from 'react';
import { ipcRenderer } from 'electron';
import { PageAsset } from '../../../common/models/delivery';
import Port from '../../../common/constants/port';
import { PlayerContextType, usePlayerEvent } from '../../context/PlayerContext';
import { ASSET_WEB_ENDED } from '../../utils/events';
import { MessageboardUpdateRequest } from '../../../common/ipc/request/MessageboardUpdateRequest';

const port = Port.SERVER_PORT;

type Props = {
  style: any;
  asset: PageAsset;
  show: boolean;
  index: number;
};

export default function Messageboard({ style, asset, show, index }: Props) {
  const [key, setKey] = useState(0);

  const { pageCount, pageTransition, toneEnabled, messageboardType, dispTitle, messageCount } = asset;
  const url = `http://localhost:${port}?pageCount=${pageCount}&pageTransition=${pageTransition}&toneEnabled=${toneEnabled}&messageboardType=${messageboardType}&dispTitle=${dispTitle}&messageCount=${messageCount}`;

  const { onPlayerEvent } = usePlayerEvent() as PlayerContextType;

  useEffect(() => {
    const handleResponse = () => {
      setKey((prevKey) => prevKey + 1);
    };

    const responseChannel = 'messageboard-update-response';
    if (show) {
      onPlayerEvent(ASSET_WEB_ENDED, { index });
      ipcRenderer.on(responseChannel, handleResponse);
      const request: MessageboardUpdateRequest = {
        responseChannel,
      };
      ipcRenderer.send('messageboard-update', request);
    }

    return () => {
      ipcRenderer.off(responseChannel, handleResponse);
    };
  }, [show]);

  return (
    <div style={style}>
      <iframe
        id="msgBoard-iframe"
        src={url}
        key={key}
        width="100%"
        height="100%"
        frameBorder="0"
        sandbox="allow-forms allow-popups allow-pointer-lock allow-same-origin allow-scripts"
      />
    </div>
  );
}
