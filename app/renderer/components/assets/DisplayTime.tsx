import React, {CSSProperties} from 'react';
import {PlayerContextType, usePlayerEvent} from '../../context/PlayerContext';
import {ASSET_TEXT_ENDED} from '../../utils/events';
import moment from "moment";

type Props = {
  keyValue: string;
  style: CSSProperties;
  src: string;
  show: boolean;
  index: number;
  timeFormat: string;
};
export default function DisplayTime({keyValue, style, src, show, index, timeFormat}: Props) {
  const {onPlayerEvent} = usePlayerEvent() as PlayerContextType;

  if (show) {
    onPlayerEvent(ASSET_TEXT_ENDED, {index});
  }

  const replaced = createText(timeFormat, src)
  let timerId = setInterval(function () {
    // @ts-ignore
    const e = document.getElementById(keyValue);
    if (e) {
      e.innerHTML = createText(timeFormat, src);
      // console.log(keyValue, "DisplayTime timer")
    } else {
      clearInterval(timerId)
      // console.log(keyValue, "DisplayTime clearInterval")
    }
  }, 1000)


  // eslint-disable-next-line react/no-danger
  return <div id={keyValue} style={style} dangerouslySetInnerHTML={{__html: replaced}}/>;
}

function createText(timeFormat: string, src: string) {
  let text = '';
  const now = moment();
  switch (timeFormat) {
    case '1':
      text = now.locale('ja').format('hh:mm');
      break;
    case '2':
      text = now.locale('ja').format('HH:mm');
      break;
    case '3':
      text = now.locale('ja').format('hh時 mm分');
      break;
    case '4':
      text = now.locale('ja').format('HH時 mm分');
      break;
    case '5':
      text = now.locale('ja').format('A hh時 mm分');
      break;
  }


  return src.replace("___REPLACE___", text);

}
