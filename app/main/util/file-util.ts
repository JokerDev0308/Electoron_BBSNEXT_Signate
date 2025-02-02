/* eslint no-console: off */
import hideFile from 'hidefile';
import path from 'path';
import * as fse from 'fs-extra';
import { PHOTOS_PATH, VIDEOS_PATH } from '../../common/constants/path';

const createDir = (filePath: string) => {
  fse.mkdirSync(filePath, { recursive: true });
};

const isPathExists = (filePath: string) => {
  return fse.existsSync(filePath);
};

const getPhotosPath = () => {
  if (!isPathExists(PHOTOS_PATH)) {
    createDir(PHOTOS_PATH);
  }
  return PHOTOS_PATH;
};

const getVideosPath = () => {
  if (!isPathExists(VIDEOS_PATH)) {
    createDir(VIDEOS_PATH);
  }
  return VIDEOS_PATH;
};

const getFileExtension = (fileName: string) => {
  const lastIndex = fileName.lastIndexOf('.') + 1;
  return fileName.substring(lastIndex);
};

const createHiddenDir = (dirPath: string) => {
  if (!isPathExists(dirPath)) {
    createDir(dirPath);
  }
  hideFile.hideSync(dirPath);
};

const copyDir = (src: string, dest: string): boolean => {
  try {
    fse.copySync(src, dest);
    return true;
  } catch (e) {
    console.log(`cannot copy ${src} to ${dest}`, e.code);
    return false;
  }
};

const emptyDir = (dir: string): boolean => {
  try {
    fse.emptyDirSync(dir);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

const deleteFile = (file: string): boolean => {
  if (!fse.existsSync(file)) return true;
  try {
    fse.unlinkSync(file);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

const getNameWithoutExtension = (filePath: string) => {
  return path.parse(filePath).name;
};

const readDirSync = (dirPath: string): string[] => {
  return fse.readdirSync(dirPath);
};

const readFileSync = (filePath: string): string | undefined => {
  if (!isPathExists(filePath)) return undefined;
  try {
    return fse.readFileSync(filePath).toString();
  } catch (e) {
    console.error(e);
    return undefined;
  }
};

const writeFileSync = (destPath: string, data: string | Buffer): boolean => {
  try {
    fse.writeFileSync(destPath, data);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

const outputJsonSync = (filePath: string, object: any): boolean => {
  try {
    fse.outputJSONSync(filePath, object);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

const readJsonSync = (filePath: string) => {
  if (!isPathExists(filePath)) return undefined;
  try {
    return fse.readJsonSync(filePath);
  } catch (e) {
    console.error(e);
    return undefined;
  }
};

export {
  createDir,
  isPathExists,
  getPhotosPath,
  getVideosPath,
  getFileExtension,
  createHiddenDir,
  copyDir,
  emptyDir,
  deleteFile,
  getNameWithoutExtension,
  readDirSync,
  readFileSync,
  writeFileSync,
  outputJsonSync,
  readJsonSync,
};
