import {MigrationInterface, QueryRunner} from "typeorm";

export default class AddReplyNumberToMessage1712194579048
  implements MigrationInterface {
  name = 'AddReplyNumberToMessage1712194579048';

  /* eslint class-methods-use-this: off */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `message` add `replyNumber` integer default 0');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('message', 'replyNumber');
  }
}
