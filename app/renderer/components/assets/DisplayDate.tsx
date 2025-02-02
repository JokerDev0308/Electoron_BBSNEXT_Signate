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
  dateFormat: string;
  weekFormat: string;
};

export default function DisplayDate({keyValue, style, src, show, index, dateFormat, weekFormat}: Props) {
  const {onPlayerEvent} = usePlayerEvent() as PlayerContextType;

  if (show) {
    onPlayerEvent(ASSET_TEXT_ENDED, {index});
  }

  const replaced = createText(dateFormat, weekFormat, src)

  let timerId = setInterval(function () {
    // @ts-ignore
    const e = document.getElementById(keyValue);
    if (e) {
      e.innerHTML = createText(dateFormat, weekFormat, src);
      //console.log(keyValue, "DisplayDate timer")
    } else {
      clearInterval(timerId)
      //console.log(keyValue, "DisplayDate clearInterval")
    }
  }, 1000)

  // eslint-disable-next-line react/no-danger
  return <div id={keyValue} style={style} dangerouslySetInnerHTML={{__html: replaced}}/>;
}

function createText(dateFormat: string, weekFormat: string, src: string) {
  let text = '';
  const now = moment();
  switch (dateFormat) {
    case '1':
      text = now.locale('ja').format('YYYY/MM/DD');
      break;
    case '2':
      text = now.locale('ja').format('MM/DD');
      break;
    case '3':
      text = now.locale('ja').format('YYYY年 MM月 DD日');
      break;
    case '4':
      text = now.locale('ja').format('MM月 DD日');
      break;
  }

  //
  switch (weekFormat) {
    case '1':
      break;
    case '2':
      text += now.locale('ja').format(' dd');
      break;
    case '3':
      text += now.locale('ja').format(' （dd）');
      break;
    case '4':
      text += now.locale('ja').format(' dddd');
      break;
    case '5':
      text += now.locale('en').format(' dddd');
      break;
  }


  return src.replace("___REPLACE___", text);

}
