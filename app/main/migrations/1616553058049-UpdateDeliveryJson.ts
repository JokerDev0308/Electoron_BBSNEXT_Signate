import { MigrationInterface, QueryRunner } from 'typeorm';
import { outputJsonSync, readJsonSync } from '../util/file-util';
import { DELIVERY_JSON_PATH } from '../../common/constants/path';
import { updateAssetsFilePath } from '../util/delivery-data';

export default class UpdateDeliveryJson1616553058049
  implements MigrationInterface {
  name = 'UpdateDeliveryJson1616553058049';

  async up(_: QueryRunner): Promise<void> {
    this.updateDeliveryJson();
  }

  async down(_: QueryRunner): Promise<void> {
    this.updateDeliveryJson(true);
  }

  private updateDeliveryJson = (unset = false) => {
    const delivery = readJsonSync(DELIVERY_JSON_PATH);
    if (delivery) {
      updateAssetsFilePath(delivery, unset);
      outputJsonSync(DELIVERY_JSON_PATH, delivery);
    }
  };
}
