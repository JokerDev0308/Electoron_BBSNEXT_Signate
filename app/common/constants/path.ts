import path from 'path';
import fs from 'fs';

// Separate app folder for development and production
const APP_DIR =
  process.env.NODE_ENV === 'development'
    ? 'ElecomSignagePlayerDev'
    : 'ElecomSignagePlayer';

const RESOURCES_PATH = process.env.NODE_ENV !== 'development'
  ? path.join(process.resourcesPath, 'resources')
  : path.join(__dirname, '../../../resources');

const APP_DATA_PATH = path.join(process.env.APPDATA as string, APP_DIR);
const AUTH_TEXT_FILE_PATH = path.join(process.env.PROGRAMDATA as string, APP_DIR, '.settings');
if (!fs.existsSync(APP_DATA_PATH)) {
  fs.mkdirSync(APP_DATA_PATH);
}
if (!fs.existsSync(AUTH_TEXT_FILE_PATH)) {
  fs.mkdirSync(AUTH_TEXT_FILE_PATH, {recursive: true});
}

const DB_PATH = path.join(APP_DATA_PATH, 'database', 'database.db');

const PUBLIC_PATH = path.join(APP_DATA_PATH, 'public');

const DELIVERY_PATH = path.join(APP_DATA_PATH, 'delivery');

const PHOTOS_PATH = path.join(DELIVERY_PATH, 'photos');

const VIDEOS_PATH = path.join(DELIVERY_PATH, 'videos');

const DELIVERY_JSON_PATH = path.join(DELIVERY_PATH, 'delivery.json');

const SETTINGS_PATH = path.join(APP_DATA_PATH, '.settings');

const AUTH_FILE_PATH = path.join(AUTH_TEXT_FILE_PATH, 'auth.txt');
const AUTH_FILE_PATH_OLD = path.join(SETTINGS_PATH, 'auth.txt');

const UPLOADS_PATH = path.join(PUBLIC_PATH, 'assets', 'uploads');

const MESSAGEBOARD_PAGE_PATH = path.join(RESOURCES_PATH, 'messageboard');

export {
  APP_DATA_PATH,
  DB_PATH,
  PUBLIC_PATH,
  DELIVERY_PATH,
  PHOTOS_PATH,
  VIDEOS_PATH,
  DELIVERY_JSON_PATH,
  SETTINGS_PATH,
  AUTH_FILE_PATH,
  AUTH_FILE_PATH_OLD,
  UPLOADS_PATH,
  MESSAGEBOARD_PAGE_PATH,
  RESOURCES_PATH,
};
