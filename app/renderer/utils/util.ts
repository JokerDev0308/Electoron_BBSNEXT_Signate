import {CSSProperties} from 'react';
import {PageAsset} from '../../common/models/delivery';
import ContentType from '../../common/constants/asset-type';

interface ExtensionMimeType {
  [key: string]: string;
}

const percent = (number: number) => `${number}%`;

const extensionFromPath = (extPath: string) =>
  extPath.slice((Math.max(0, extPath.lastIndexOf('.')) || Infinity) + 1);

const mimeFromExtension = (extension: string) => {
  const extensionToType: ExtensionMimeType = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogv: 'video/ogg',
    mpg: 'video/mpeg',
    mpeg: 'video/mpeg',
    avi: 'video/avi',
  };

  let videoType = extensionToType[extension];
  if (!videoType) {
    videoType = 'video/unknown';
  }

  return videoType;
};

const mimeFromPath = (srcPath: string): string => {
  return mimeFromExtension(extensionFromPath(srcPath));
};

const getStyle = (
  asset: PageAsset,
  pageWidth: number,
  pageHeight: number,
  playerWidth = window.innerWidth,
  playerHeight = window.innerHeight
): CSSProperties => {
  const {type, x, y, z, width, height} = asset;
  if (type === ContentType.TEXT || type === ContentType.SCROLL_TEXT || type === ContentType.TEXT_V || type === ContentType.SCROLL_TEXT_V ||
    type === ContentType.DISPLAY_DATE || type === ContentType.COUNT_DATE ||
    type === ContentType.DISPLAY_TIME) {
    return {
      position: 'absolute',
      left: percent((x / pageWidth) * 100),
      top: percent((y / pageHeight) * 100),
      width,
      height,
      zIndex: z,
      transform: `scale(
        ${playerWidth / pageWidth},
        ${playerHeight / pageHeight}
      )`,
      transformOrigin: '0% 0%',
    };
  }

  return {
    position: 'absolute',
    left: percent((x / pageWidth) * 100),
    top: percent((y / pageHeight) * 100),
    width: percent((width / pageWidth) * 100),
    height: percent((height / pageHeight) * 100),
    zIndex: z,
  };
};

/**
 * Calculate player size to maintain aspect ratio.
 * @param width Content's width
 * @param height Content's height
 */
const calculatePlayerSize = (width: number, height: number) => {
  const viewportAspectRatio = window.innerWidth / window.innerHeight;
  const contentAspectRatio = width / height;

  if (viewportAspectRatio <= contentAspectRatio) {
    return {
      playerWidth: window.innerWidth,
      playerHeight: (height / width) * window.innerWidth,
    };
  }

  return {
    playerHeight: window.innerHeight,
    playerWidth: (width / height) * window.innerHeight,
  };
};

export {
  percent,
  extensionFromPath,
  mimeFromExtension,
  mimeFromPath,
  getStyle,
  calculatePlayerSize,
};
