import React, {useEffect, useState} from 'react';
import {SlideshowAsset} from '../../../../common/models/delivery';
import moment from "moment";

type Props = {
  asset: SlideshowAsset;
  onEnded: () => void;
  slideCount: number;
};

export default function Web({asset, onEnded, slideCount}: Props) {
  const {src, transitionType, duration} = asset;
  const [keyValue, setKeyValue] = useState("default");

  useEffect(() => {
    // 指定秒数経過したら次に遷移するタイマー
    const timer = setTimeout(
      function () {
        if (slideCount === 1) {
          // 単一ページスライドショー
          //  リロードさせるために Key の値を変更する
          //  →Keyを変更するとelementが再生成されるのでリロードが実行できる
          setKeyValue(moment().format("YYYYMMDDHHmmss"))
        } else {
          // 単一ページのスライドショー以外の場合
          //  次のスライドに遷移させる
          onEnded()
        }
      }, duration * 1000);
    return () => {
      clearTimeout(timer);
    };
  });

  const transition = transitionType === 'fade in' ? 'Slideshow--fade' : '';

  let timeParam;
  const now = Date.now();
  if(src.includes("?")){
    timeParam = "&t="+now;
  }else{
    timeParam = "?t="+now;
  }

  return (
    <iframe
      key={keyValue}
      src={`${src}${timeParam}`}
      width="100%"
      height="100%"
      frameBorder="0"
      sandbox="allow-forms allow-popups allow-pointer-lock allow-same-origin allow-scripts"
      className={transition}
    />
  );
}
