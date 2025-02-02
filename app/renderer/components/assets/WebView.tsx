import React, {CSSProperties} from 'react';
import {PlayerContextType, usePlayerEvent} from '../../context/PlayerContext';
import {ASSET_WEB_ENDED, IFRAME_HTML_LOADED} from '../../utils/events';

type Props = {
  style: CSSProperties;
  src: string;
  show: boolean;
  index: number;
};

export default function WebView({style, src, show, index}: Props) {
  const {onPlayerEvent} = usePlayerEvent() as PlayerContextType;

  let timeParam;
  const now = Date.now();
  if(src.includes("?")){
    timeParam = "&t="+now;
  }else{
    timeParam = "?t="+now;
  }

  if (show) {
    onPlayerEvent(ASSET_WEB_ENDED, {index});
  }

  return (
    <div style={style}>
      <iframe
        src={`${src}${timeParam}`}
        width="100%"
        height="100%"
        frameBorder="0"
        sandbox="allow-forms allow-popups allow-pointer-lock allow-same-origin allow-scripts"
        onLoad={() => {
          onPlayerEvent(IFRAME_HTML_LOADED, {});
        }}
      />
    </div>
  );
}
