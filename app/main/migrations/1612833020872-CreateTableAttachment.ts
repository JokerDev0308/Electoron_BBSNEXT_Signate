import { MigrationInterface, QueryRunner } from 'typeorm';

export default class CreateTableAttachment1612833020872
  implements MigrationInterface {
  name = 'CreateTableAttachment1612833020872';

  /* eslint class-methods-use-this: off */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "attachment" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "url" text NOT NULL,
      "name" text NOT NULL,
      "assetId" integer NOT NULL,
      "messageId" integer NOT NULL,
      CONSTRAINT "FK_messageId" FOREIGN KEY ("messageId") REFERENCES "message" ("id") ON DELETE CASCADE
    )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('attachment');
  }
}
