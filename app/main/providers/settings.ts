import { getConnection } from 'typeorm';
import SettingsEntity from '../entities/SettingsEntity';
import SettingsKeys from '../enums/settings-keys';

export async function saveSetting(settings: SettingsEntity) {
  return getConnection().getRepository(SettingsEntity).save(settings);
}

export async function getSetting(key: SettingsKeys) {
  return getConnection()
    .getRepository(SettingsEntity)
    .createQueryBuilder('settings')
    .where('settings.key = :key', { key })
    .getOne();
}

export async function deleteSetting(key: SettingsKeys) {
  return getConnection().getRepository(SettingsEntity).delete({ key });
}

export async function updateSetting(
  key: SettingsKeys,
  value: string
): Promise<SettingsEntity> {
  let setting = await getSetting(key);
  if (!setting) {
    setting = new SettingsEntity();
    setting.key = key;
  }
  setting.value = value;
  return saveSetting(setting);
}
