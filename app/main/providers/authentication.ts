import { MessageboardStatusValue } from '../models/messageboard';
import SettingsKeys from '../enums/settings-keys';
import {
   createDir,
  createHiddenDir, isPathExists,
  readFileSync,
  writeFileSync
} from '../util/file-util';
import { getSetting, updateSetting } from './settings';
import { decrypt, encrypt, sha256 } from '../util/crypto';
import SystemInfo from './system-info';
import { AUTH_FILE_PATH, AUTH_FILE_PATH_OLD, SETTINGS_PATH } from '../../common/constants/path';
import { MessageboardStatus } from '../enums/messageboard';
import { copyFileSync } from 'fs';

const SECRET_KEY = 'lqtRxVopduIhFi0Y';
export const SIGNAGE_AUTH_KEY = 'L8zYpyRs';
export const MESSAGE_BOARD_AUTH_KEY = '7edcTnhy';

const generateAuthHash = (key: String): string => {
  const { serialNumber } = SystemInfo.Instance.device;
  const elecomSerialNum = `elecom${serialNumber}${key}`;
  return sha256(elecomSerialNum);
};

export const createAuthFile = (key: String): boolean => {
  createHiddenDir(SETTINGS_PATH);
  const authHash = generateAuthHash(key);
  return writeFileSync(AUTH_FILE_PATH, authHash);
};

export async function isAppAuthenticated(): Promise<boolean> {
  // 新フォルダに存在せずに旧フォルダに存在している場合は新フォルダにコピーする
  if (!isPathExists(SETTINGS_PATH)) {
    console.log('create folder ' + SETTINGS_PATH);
    createDir(SETTINGS_PATH);
  }
  if (!isPathExists(AUTH_FILE_PATH) && isPathExists(AUTH_FILE_PATH_OLD)) {
    console.log('copy file ' + AUTH_FILE_PATH_OLD + ' to ' + AUTH_FILE_PATH);
    copyFileSync(AUTH_FILE_PATH_OLD, AUTH_FILE_PATH);
  }

  //
  const existingAuth = readFileSync(AUTH_FILE_PATH);
  if (!existingAuth) {
    return false;
  }
  //
  const serial = generateAuthHash('');
  const signage = generateAuthHash(SIGNAGE_AUTH_KEY);
  const message_board = generateAuthHash(MESSAGE_BOARD_AUTH_KEY);

  console.log('----------------------------------');
  console.log('serial :' + serial);
  console.log('signage : ' + signage);
  console.log('message_board : ' + message_board);
  console.log('');
  console.log('text : ' + existingAuth);
  console.log('----------------------------------');
  // ---------------------------
  // elecom+シリアル番号
  // 　　MBありなしはDBのMBフラグを判断
  // 　　　MBフラグが[MBなし]だった
  // 　　　　auth.txt を elecom+シリアル番号+サイネージ認証キー に更新
  // 　　　　※別ユーザでアップデートした場合 この状態になるため配信PCから有効化してもらう（が許される？）
  //
  // 　　　MBフラグが[MBあり]だった
  // 　　　　auth.txt を elecom+シリアル番号+ MB認証キー に更新
  // 　　　　※使用中のユーザでアップデートした場合
  // 　　
  // elecom+シリアル番号+サイネージ認証キー
  // 　　MBなし
  //
  // elecom+シリアル番号+MB認証キー
  // 　　MBあり
  // 　　起動する都度 DBのMBありフラグを[MBあり]の状態に更新する
  // 　　　（ユーザ切り替えの対応）
  // ---------------------------

  if (existingAuth === serial) {
    // elecom+シリアル番号
    const setting = await getSetting(SettingsKeys.MessageboardStatus);

    if (setting) {
      const status = JSON.parse(setting.value);
      if (status.status !== MessageboardStatus.ACTIVATED) {
        // auth.txt を MBなしで作成しなおす
        createAuthFile(SIGNAGE_AUTH_KEY);
      } else {
        // auth.txt を MBありで作成しなおす
        createAuthFile(MESSAGE_BOARD_AUTH_KEY);
        //  DB値をMB有効に更新する
        await activateMessageboardStatus(MessageboardStatus.ACTIVATED, MESSAGE_BOARD_AUTH_KEY);
      }
    }
    return true;
  } else if (existingAuth === signage) {
    // elecom+シリアル番号+サイネージ認証キー
    return true;

  } else if (existingAuth === message_board) {
    // elecom+シリアル番号+MB認証キー

    //  DB値をMB有効に更新する
    await activateMessageboardStatus(MessageboardStatus.ACTIVATED, MESSAGE_BOARD_AUTH_KEY);
    //
    return true;
  }


  return false;
}

export async function activateMessageboardStatus(
  status: number,
  key = MESSAGE_BOARD_AUTH_KEY
): Promise<MessageboardStatusValue> {
  const encrypted = encrypt(SECRET_KEY, key);
  const value: MessageboardStatusValue = { status, key: encrypted };
  await updateSetting(SettingsKeys.MessageboardStatus, JSON.stringify(value));
  // Return the un-encrypted key
  return { status, key };
}

export async function getMessageboardStatus() {
  const setting = await getSetting(SettingsKeys.MessageboardStatus);

  if (setting) {
    const status = JSON.parse(setting.value);
    status.key = decrypt(SECRET_KEY, status.key);
    return status;
  }

  return undefined;
}

export async function validateKey(key: string): Promise<boolean> {
  if (key === SIGNAGE_AUTH_KEY) {
    // サイネージのみ
    return createAuthFile(key);
  }
  if (key === MESSAGE_BOARD_AUTH_KEY) {
    // メッセージボードあり
    await activateMessageboardStatus(MessageboardStatus.ACTIVATED, key);
    return createAuthFile(key);
  }
  return false;
}
