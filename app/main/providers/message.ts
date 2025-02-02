import moment from 'moment';
import { Brackets, getConnection, QueryRunner } from 'typeorm';
import AttachmentEntity from '../entities/AttachmentEntity';
import MessageEntity from '../entities/MessageEntity';
import { MessagePriority, MessageStatus } from '../enums/messageboard';
import { deleteAttachmentsByMessageId, saveAttachments } from './attachment';
import ReplyTextEntity from '../entities/ReplyTextEntity';
import { deleteReplyTextsByMessageId, saveReplyTexts } from './reply-text';

export async function saveMessage(
  message: MessageEntity,
  queryRunner: QueryRunner
) {
  return queryRunner.manager.insert(MessageEntity, message);
}

export async function getMessagesPaginate(
  page: number,
  limit: number,
  pinned: number
) {
  let queryBuilder = getConnection()
    .createQueryBuilder()
    .select('message')
    .from(MessageEntity, 'message')
    .where('message.status != :status', { status: MessageStatus.DELETED })
    .andWhere(
      new Brackets((qb) => {
        qb.where('message.expiredAt > :expiredAt', {
          expiredAt: moment(new Date()).format('YYYY-MM-DD HH:mm'),
        }).orWhere(`message.expiredAt = ''`);
      })
    )
    .leftJoinAndSelect('message.attachments', 'attachments')
    .leftJoinAndSelect('message.replyTexts', 'replyText')
    .orderBy('message.id', 'DESC');

  if (pinned != null) {
    queryBuilder = queryBuilder.andWhere('message.isPinned = :isPinned', {
      isPinned: pinned,
    });
  }

  let query = await queryBuilder.getMany();
  const count = query.length;

  if (
    page != null &&
    limit != null &&
    !Number.isNaN(page) &&
    !Number.isNaN(limit)
  ) {
    const offset = limit * (page - 1);
    query = await queryBuilder.skip(offset).take(limit).getMany();
  }

  return { totalCount: count, messages: query };
}

export async function getAllMessages() {
  return getConnection()
    .createQueryBuilder()
    .select('message')
    .from(MessageEntity, 'message')
    .leftJoinAndSelect('message.attachments', 'attachments')
    .leftJoinAndSelect('message.replyTexts', 'replyTexts')
    .getMany();
}

export async function removeAllMessages(queryRunner: QueryRunner) {
  return queryRunner.manager
    .createQueryBuilder()
    .delete()
    .from(MessageEntity)
    .execute();
}

export async function messageOmit(messageId: number, queryRunner: QueryRunner) {
  const msgRepository = await queryRunner.manager.getRepository(MessageEntity);
  const message = await msgRepository.findOne(messageId);

  if (message) {
    message.status = MessageStatus.OMITTED;
    if (message.isPinned) {
      message.isPinned = MessagePriority.UNPINNED;
    }

    return msgRepository.save(message);
  }

  return undefined;
}

export async function getMessageById(id: number) {
  return getConnection()
    .createQueryBuilder()
    .select('message')
    .from(MessageEntity, 'message')
    .where('message.id == :id', { id })
    .getOne();
}

export async function getMessageByUid(uid: number) {
  return getConnection()
    .createQueryBuilder()
    .select('message')
    .from(MessageEntity, 'message')
    .where('message.uid == :uid', { uid })
    .leftJoinAndSelect('message.attachments', 'attachments')
    .leftJoinAndSelect('message.replyTexts', 'replyTexts')
    .getOne();
}

export async function unpinMessagesExcept(
  id: number,
  queryRunner: QueryRunner
) {
  return queryRunner.manager
    .createQueryBuilder()
    .update(MessageEntity)
    .set({
      isPinned: MessagePriority.UNPINNED,
    })
    .where('id != :id', { id })
    .execute();
}

export async function messageUpdate(
  message: MessageEntity,
  queryRunner: QueryRunner
) {
  await queryRunner.manager.update(MessageEntity, message.id, message);
}

export async function updateMessageAndAttachmentsAndReplyTexts(
  message: MessageEntity,
  attachments: AttachmentEntity[],
  replyTexts: ReplyTextEntity[],
  queryRunner: QueryRunner
) {
  // Update message
  await messageUpdate(message, queryRunner);

  // Delete previous attachments of message
  await deleteAttachmentsByMessageId(message.id, queryRunner);
  await deleteReplyTextsByMessageId(message.id, queryRunner);

  // Save new attachments
  await saveAttachments(attachments, queryRunner);
  await saveReplyTexts(replyTexts, queryRunner);
}

export async function messageUnOmit(
  messageId: number,
  queryRunner: QueryRunner
) {
  const msgRepository = await queryRunner.manager.getRepository(MessageEntity);
  const message = await msgRepository.findOne(messageId);

  if (message) {
    message.status = MessageStatus.ACTIVE;
    message.isPinned = MessagePriority.UNPINNED;

    return msgRepository.save(message);
  }

  return undefined;
}

export async function getExpiredMessages() {
  return getConnection()
    .createQueryBuilder()
    .select('message')
    .from(MessageEntity, 'message')
    .where('message.status != :status', { status: MessageStatus.DELETED })
    .andWhere(
      new Brackets((qb) => {
        qb.where(`message.expiredAt != ''`).andWhere(
          'message.expiredAt <= :expiredAt',
          {
            expiredAt: moment(new Date()).format('YYYY-MM-DD HH:mm'),
          }
        );
      })
    )
    .leftJoinAndSelect('message.attachments', 'attachments')
    .getMany();
}

export async function updateExpiredMessages(
  messages: MessageEntity[],
  queryRunner: QueryRunner
) {
  for (let i = 0; i < messages.length; i += 1) {
    queryRunner.manager.update(MessageEntity, messages[i].id, {
      status: MessageStatus.DELETED,
      deletedAt: moment(new Date()).format('YYYY-MM-DD HH:mm'),
    });
  }
}
