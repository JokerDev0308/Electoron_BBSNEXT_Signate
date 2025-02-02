import { getConnection, QueryRunner } from 'typeorm';
import AttachmentEntity from '../entities/AttachmentEntity';

export async function saveAttachments(
  attachments: AttachmentEntity[],
  queryRunner: QueryRunner
) {
  return queryRunner.manager.insert(AttachmentEntity, attachments);
}

export async function deleteAttachments(queryRunner: QueryRunner) {
  return queryRunner.manager
    .createQueryBuilder()
    .delete()
    .from(AttachmentEntity)
    .execute();
}

export async function getAttachmentByMessageId(messageId: number) {
  return getConnection()
    .createQueryBuilder()
    .select('attachment')
    .from(AttachmentEntity, 'attachment')
    .where('messageId = :messageId', { messageId })
    .getMany();
}

export async function getAttachmentsByUrlExcept(
  messageId: number,
  url: string
) {
  return getConnection()
    .createQueryBuilder()
    .select('attachment')
    .from(AttachmentEntity, 'attachment')
    .where('url == :url', { url })
    .andWhere('messageId != :messageId', { messageId })
    .getMany();
}

export async function deleteAttachmentsByMessageId(
  messageId: number,
  queryRunner: QueryRunner
) {
  return queryRunner.manager
    .createQueryBuilder()
    .delete()
    .from(AttachmentEntity)
    .where('messageId == :messageId', { messageId })
    .execute();
}

export async function deleteAttachmentsByMessagesId(
  messageIds: number[],
  queryRunner: QueryRunner
) {
  queryRunner.manager
    .createQueryBuilder()
    .delete()
    .from(AttachmentEntity)
    .where('messageId IN (:...message)', { message: messageIds })
    .execute();
}
