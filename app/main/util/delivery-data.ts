import path from 'path';
import {
  Delivery,
  Content,
  Page,
  PageAsset,
  SlideshowAsset,
  Timetable,
} from '../../common/models/delivery';
import AssetType from '../../common/constants/asset-type';
import {
  deleteFile,
  getFileExtension,
  getPhotosPath,
  getVideosPath,
  readDirSync,
} from './file-util';

export interface AssetFileInfo {
  type: AssetType;
  srcUrl: string;
  localPath: string;
}

const getAssetPath = (src: string, md5hash: string, type: string) => {
  const hashName = `${md5hash}.${getFileExtension(src)}`;
  if (type === AssetType.PHOTO) {
    return path.join(getPhotosPath(), hashName);
  }
  return path.join(getVideosPath(), hashName);
};

const getExistingAssets = (assetType: string) => {
  const assetDir =
    assetType === AssetType.PHOTO ? getPhotosPath() : getVideosPath();

  const files = readDirSync(assetDir);
  return files.map((file) => path.join(assetDir, file));
};

const deleteAllAssetsExcept = (assetPaths: string[]) => {
  const existingAssets: string[] = [
    ...getExistingAssets(AssetType.VIDEO),
    ...getExistingAssets(AssetType.PHOTO),
  ];

  const toDelete = existingAssets.filter((existing) => {
    return assetPaths.indexOf(existing) === -1;
  });

  toDelete.forEach(deleteFile);
};

const getPages = (timeTables: Timetable[]) => {
  const pageList: Page[] = [];

  timeTables.forEach(({ contents }) => {
    contents.forEach(({ pages }) => {
      pageList.push(...pages);
    });
  });

  return pageList;
};

const getFileAssets = (timeTables: Timetable[]): AssetFileInfo[] => {
  const fileInfos: AssetFileInfo[] = [];
  const pages = getPages(timeTables);

  const addFile = (asset: PageAsset | SlideshowAsset) => {
    const { type, src, md5Sum } = asset;
    if (type === AssetType.PHOTO || type === AssetType.VIDEO) {
      const srcUrl = src as string;
      const localPath = getAssetPath(srcUrl, md5Sum!, type);
      fileInfos.push({ type, srcUrl, localPath });
    }
  };

  pages.forEach(({ assets }) => {
    assets.forEach((asset) => {
      if (asset.type === AssetType.SLIDESHOW) {
        const slideAssets = asset.src as SlideshowAsset[];
        slideAssets.forEach(addFile);
      } else {
        addFile(asset);
      }
    });
  });

  return fileInfos;
};

/**
 * Update the file path of photo and video assets with local path.
 */
const updateAssetsFilePath = (delivery: Delivery, unset = false): Delivery => {
  const { normal, alert } = delivery;

  const updatePath = (asset: PageAsset | SlideshowAsset) => {
    const { type, src, md5Sum } = asset;
    if (type === AssetType.PHOTO || type === AssetType.VIDEO) {
      asset.filePath = unset
        ? undefined
        : getAssetPath(src as string, md5Sum!, type);
    }
  };

  const processUpdate = ({ pages }: Content) => {
    pages.forEach(({ assets }) => {
      assets.forEach((asset) => {
        if (asset.type === AssetType.SLIDESHOW) {
          const slideAssets = asset.src as SlideshowAsset[];
          slideAssets.forEach(updatePath);
        } else {
          updatePath(asset);
        }
      });
    });
  };

  normal.timetables.forEach(({ contents }) => {
    contents.forEach(processUpdate);
  });
  alert.timetables.forEach(({ contents }) => {
    contents.forEach(processUpdate);
  });

  return delivery;
};

export { deleteAllAssetsExcept, getFileAssets, updateAssetsFilePath };
