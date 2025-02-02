import { MigrationInterface, QueryRunner } from 'typeorm';

export default class CreateTableReplytext1617587938323
  implements MigrationInterface {
  name = 'CreateTableReplytext1617587938323';

  /* eslint class-methods-use-this: off */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "reply_text" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "text" text NOT NULL,
      "messageId" integer NOT NULL,
      CONSTRAINT "FK_messageId" FOREIGN KEY ("messageId") REFERENCES "message" ("id") ON DELETE CASCADE
    )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('reply_text');
  }
}
