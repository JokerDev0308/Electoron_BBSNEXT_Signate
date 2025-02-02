import { MigrationInterface, QueryRunner } from 'typeorm';

export default class CreateTableSettings1610443829903
  implements MigrationInterface {
  name = 'CreateTableSettings1610443829903';

  /* eslint class-methods-use-this: off */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "settings" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "key" TEXT NOT NULL UNIQUE,
      "value" TEXT
      )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('settings');
  }
}
