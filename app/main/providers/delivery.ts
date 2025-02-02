import { Delivery } from '../../common/models/delivery';
import { readJsonSync } from '../util/file-util';
import { DELIVERY_JSON_PATH } from '../../common/constants/path';
import SettingsKeys from '../enums/settings-keys';
import { deleteSetting, updateSetting } from './settings';

export function getDeliveryJson(): Delivery | undefined {
  return readJsonSync(DELIVERY_JSON_PATH);
}

export async function setPostDeliveryDateTime(dateTime: string) {
  await updateSetting(SettingsKeys.PostDeliverySchedule, dateTime);
}

export async function deletePostDeliveryDateTime() {
  await deleteSetting(SettingsKeys.PostDeliverySchedule);
}
