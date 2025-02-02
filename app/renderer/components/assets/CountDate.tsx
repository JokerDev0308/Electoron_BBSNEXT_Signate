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
  countFormat: string;
  countType: string;
  baseDate: string;
};

export default function CountDate({keyValue, style, src, show, index, countFormat, countType, baseDate}: Props) {

  const {onPlayerEvent} = usePlayerEvent() as PlayerContextType;

  if (show) {
    onPlayerEvent(ASSET_TEXT_ENDED, {index});
  }

  const replaced = createText(baseDate, countFormat, countType, src)

  let timerId = setInterval(function () {
    // @ts-ignore
    const e = document.getElementById(keyValue);
    if (e) {
      e.innerHTML = createText(baseDate, countFormat, countType, src)
      // console.log(keyValue, "CountDate timer")
    } else {
      clearInterval(timerId)
      // console.log(keyValue, "CountDate clearInterval")
    }
  }, 1000)


  // eslint-disable-next-line react/no-danger
  return <div id={keyValue} style={style} dangerouslySetInnerHTML={{__html: replaced}}/>;
}

function createText(baseDate: string, countFormat: string, countType: string, src: string) {
  let text = '';
  const now = moment().hour(0).minute(0).second(0).millisecond(0);
  const target = moment(baseDate);
  let diff = now.diff(target, 'days');
  if (countType === '1') {
    // カウントアップ
    if (diff < 0) {
      diff = 0;
    }
  } else if (countType === '2') {
    // カウントダウン
    if (diff > 0) {
      diff = 0;
    } else {
      diff *= -1;
    }
  }
  if (diff > 9999) {
    diff = 9999;
  }
  //
  if (countFormat === '2') {
    // 桁埋めしない
    text = diff;
  } else {
    text = ("0000" + diff).slice(-4);
  }
  return src.replace("___REPLACE___", text);
}
