import { QueryRunner, getConnection } from 'typeorm';
import ReplyTextEntity from '../entities/ReplyTextEntity';

export async function saveReplyTexts(
  replyTexts: ReplyTextEntity[],
  queryRunner: QueryRunner
) {
  return queryRunner.manager.insert(ReplyTextEntity, replyTexts);
}

export async function deleteReplyTexts(queryRunner: QueryRunner) {
  return queryRunner.manager
    .createQueryBuilder()
    .delete()
    .from(ReplyTextEntity)
    .execute();
}

export async function deleteReplyTextsByMessageId(
  messageId: number,
  queryRunner: QueryRunner
) {
  return queryRunner.manager
    .createQueryBuilder()
    .delete()
    .from(ReplyTextEntity)
    .where('messageId == :messageId', { messageId })
    .execute();
}

export async function deleteReplyTextsByMessagesId(
  messageIds: number[],
  queryRunner: QueryRunner
) {
  queryRunner.manager
    .createQueryBuilder()
    .delete()
    .from(ReplyTextEntity)
    .where('messageId IN (:...message)', { message: messageIds })
    .execute();
}
