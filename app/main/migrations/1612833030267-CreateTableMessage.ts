import { MigrationInterface, QueryRunner } from 'typeorm';

export default class CreateTableMessage1612833030267
  implements MigrationInterface {
  name = 'CreateTableMessage1612833030267';

  /* eslint class-methods-use-this: off */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "message" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "uid" integer NOT NULL,
      "deviceName" text NOT NULL,
      "senderName" text NOT NULL,
      "message" text NOT NULL,
      "isImportant" integer DEFAULT 0,
      "isPinned" integer DEFAULT 0,
      "status" integer DEFAULT 1,
      "deletedAt" text,
      "hostId" text NOT NULL,
      "serialNumber" text NOT NULL,
      "expiredAt" text,
      "timeSent" text NOT NULL,
      "createdTime" text NOT NULL
    )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(`message`);
  }
}
