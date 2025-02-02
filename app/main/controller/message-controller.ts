import { shell } from 'electron';
import path from 'path';
import moment from 'moment';
import express from 'express';
import { getConnection, QueryRunner } from 'typeorm';
import { PUBLIC_PATH, UPLOADS_PATH } from '../../common/constants/path';
import SettingsKeys from '../enums/settings-keys';
import {
  MessageTone,
  MessagePriority,
  MessageType,
  MessageStatus,
} from '../enums/messageboard';
import ResponseStatus from '../enums/response-status';
import MessageEntity from '../entities/MessageEntity';
import AttachmentEntity from '../entities/AttachmentEntity';
import ReplyTextEntity from '../entities/ReplyTextEntity';
import { ApiResult, Attachment, Message, MessageResponse, ReplyText } from '../models/api';
import MessageboardUpdateChannel from '../ipc/channels/MessageboardUpdateChannel';
import registerChannels from '../ipc';
import { getSetting, updateSetting } from '../providers/settings';
import {
  getAllMessages,
  getExpiredMessages,
  getMessageById,
  getMessageByUid,
  getMessagesPaginate,
  messageOmit,
  messageUnOmit,
  messageUpdate,
  removeAllMessages,
  saveMessage,
  unpinMessagesExcept,
  updateExpiredMessages,
  updateMessageAndAttachmentsAndReplyTexts,
} from '../providers/message';
import {
  deleteAttachments,
  deleteAttachmentsByMessageId,
  deleteAttachmentsByMessagesId,
  getAttachmentsByUrlExcept,
  saveAttachments,
} from '../providers/attachment';
import {
  deleteReplyTexts,
  deleteReplyTextsByMessageId,
  saveReplyTexts,
} from '../providers/reply-text';
import {
  createDir,
  deleteFile,
  emptyDir,
  getNameWithoutExtension,
  writeFileSync,
} from '../util/file-util';
import { extensionFromPath } from '../../renderer/utils/util';

export default class MessageController {
  private readonly EXPIRED_CHECKER_INTERVAL = 10;

  updateChannel: MessageboardUpdateChannel;

  constructor() {
    this.updateChannel = new MessageboardUpdateChannel();
    registerChannels(this.updateChannel);
    this.expiredMessagesScheduler();
  }

  private expiredMessagesScheduler = () => {
    setInterval(
      this.handleExpiredMessages,
      this.EXPIRED_CHECKER_INTERVAL * 1000
    );
  };

  private playNotificationTone = async () => {
    const setting = await getSetting(SettingsKeys.MessageToneEnabled);
    const toneEnabled = setting && parseInt(setting.value, 10);
    if (toneEnabled === MessageTone.ENABLED) {
      shell.beep();
    }
  };

  private notifyPlayer = async (isToneEnabled = true) => {
    this.updateChannel.reply();
    if (isToneEnabled) {
      await this.playNotificationTone();
    }
  };

  private uploadAttachments = (
    images: Express.Multer.File[],
    attachments: Attachment[]
  ): AttachmentEntity[] => {
    const uploadDir = path.join(UPLOADS_PATH, 'images');
    createDir(uploadDir);

    const uploaded: AttachmentEntity[] = [];
    attachments.forEach((attachment) => {
      const image = images.find(
        ({ originalname }) => decodeURI(originalname) === attachment.name
      );
      if (!image) {
        throw new Error(`Cannot find image of attachment '${attachment.name}'`);
      }
      const fileExt = extensionFromPath(attachment.name);
      const hashName = `${attachment.md5Sum}.${fileExt}`;

      const filePath = path.join(uploadDir, hashName);
      if (!writeFileSync(filePath, image.buffer)) {
        throw new Error(`Error creating file ${filePath}'`);
      }

      const attachmentEntity = new AttachmentEntity();
      attachmentEntity.url = `assets/uploads/images/${hashName}`;
      attachmentEntity.name = attachment.name;
      attachmentEntity.assetId = attachment.assetId;

      uploaded.push(attachmentEntity);
    });
    return uploaded;
  };

  private clearAttachments = async (
    messageId?: number,
    attachments?: AttachmentEntity[]
  ) => {
    if (messageId && attachments) {
      await Promise.all(
        attachments.map(async (attachment) => {
          // Check if used by other messages
          const inOtherMessages = await getAttachmentsByUrlExcept(
            messageId,
            attachment.url
          );

          if (inOtherMessages.length === 0) {
            const filePath = path.join(PUBLIC_PATH, attachment.url);
            await deleteFile(filePath);
          }
        })
      );
    } else if (!attachments) {
      const imageDirectory = path.join(UPLOADS_PATH, 'images');
      await emptyDir(imageDirectory);
    }
  };

  private formatDateTime = (date: string | Date) =>
    moment(date).format('YYYY-MM-DD HH:mm');

  private persistMessageAndAttachmentsAndReplyTexts = async (
    messageEntity: MessageEntity,
    attachments: AttachmentEntity[],
    replyTexts: ReplyTextEntity[],
    queryRunner: QueryRunner
  ) => {
    const result = await saveMessage(messageEntity, queryRunner);
    attachments.forEach((attachment) => {
      attachment.message = result.raw;
    });
    replyTexts.forEach((replyText) => {
      replyText.message = result.raw;
    });

    await saveAttachments(attachments, queryRunner);
    await saveReplyTexts(replyTexts, queryRunner);
  };

  private handleCreateMessage = async (
    images: Express.Multer.File[],
    message: Message
  ): Promise<ApiResult> => {
    let attachments: AttachmentEntity[] = [];
    let replyTexts: ReplyTextEntity[] = [];
    let messageEntity: MessageEntity = new MessageEntity();

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      attachments = this.uploadAttachments(images, message.attachments);
      if(message.replyTexts){
        message.replyTexts.forEach((replyText: ReplyText) => {
          const replyTextEntity = new ReplyTextEntity();
          replyTextEntity.text = replyText.text;
          replyTexts.push(replyTextEntity);
        });
      }

      messageEntity = Object.assign(messageEntity, message);
      messageEntity.timeSent = this.formatDateTime(message.timeSent);
      messageEntity.createdTime = this.formatDateTime(new Date());

      await this.persistMessageAndAttachmentsAndReplyTexts(
        messageEntity,
        attachments,
        replyTexts,
        queryRunner
      );
      if (messageEntity.isPinned) {
        await unpinMessagesExcept(messageEntity.id, queryRunner);
      }
      await queryRunner.commitTransaction();

      this.notifyPlayer();

      return {
        status: ResponseStatus.SUCCESS,
        message: 'Success! New message created',
      };
    } catch (e) {
      await this.clearAttachments(messageEntity.id, attachments);
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  };

  private handleUpdateMessage = async (
    files: Express.Multer.File[],
    newAttachments: [],
    newReplyTexts: [],
    messageToUpdate: MessageEntity
  ) => {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete previous attachments
      const prevAttachments = messageToUpdate.attachments;
      await this.clearAttachments(messageToUpdate.id, prevAttachments);

      // Upload new attachments
      const uploaded = this.uploadAttachments(files, newAttachments);
      const attachmentEntities = uploaded.map((attachment) => {
        const entity = Object.assign(new AttachmentEntity(), attachment);
        entity.message = messageToUpdate;
        return entity;
      });

      //
      let replyTextEntities: ReplyTextEntity[] = [];
      newReplyTexts.forEach( async (replyText: ReplyTextEntity) => {
        const replyTextEntity = new ReplyTextEntity();
        replyTextEntity.text = replyText.text;
        replyTextEntity.message = messageToUpdate;
        replyTextEntities.push(replyTextEntity);
      });

      // Update message and attachments
      delete messageToUpdate.attachments;
      delete messageToUpdate.replyTexts;      
      messageToUpdate.timeSent = this.formatDateTime(new Date());

      await updateMessageAndAttachmentsAndReplyTexts(
        messageToUpdate,
        attachmentEntities,
        replyTextEntities,
        queryRunner
      );
      if (messageToUpdate.isPinned) {
        await unpinMessagesExcept(messageToUpdate.id, queryRunner);
      }
      await queryRunner.commitTransaction();

      this.notifyPlayer();

      return {
        status: ResponseStatus.SUCCESS,
        message: 'Success! Message Updated',
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  };

  createMessage(req: express.Request): Promise<ApiResult> {
    const images = req.files as Express.Multer.File[];
    const message: Message = JSON.parse(req.body.message);

    return this.handleCreateMessage(images, message);
  }

  fetchMessages = async (req: express.Request): Promise<ApiResult> => {
    const reqLimit = req.query.limit;
    const reqPage = req.query.page;

    const page = Number(reqPage);
    const limit = Number(reqLimit);
    const pinned =
      req.query.pinned === 'true'
        ? MessagePriority.PINNED
        : MessagePriority.UNPINNED;

    const result = await getMessagesPaginate(page, limit, pinned);
    const { totalCount, messages } = result;
    messages.forEach(({ attachments }: MessageEntity) => {
      attachments.forEach((attachment: AttachmentEntity) => {
        const md5Sum = getNameWithoutExtension(attachment.url);
        Object.assign(attachment, { md5Sum, id: undefined });
      });
    });
    const responseMessages = Object.assign([], messages)
    responseMessages.forEach((message: any) => {
      const sortedReplyTexts: ReplyTextEntity[] = message.replyTexts.sort((a: ReplyTextEntity, b: ReplyTextEntity) => {
        return a.id < b.id ? -1 : 1;
      });
      const setReplyTexts: ReplyTextEntity[] = [];
      sortedReplyTexts.forEach((replyTextEntity: ReplyTextEntity) => {
        setReplyTexts.push(replyTextEntity);
      });
      message.replyTexts = setReplyTexts;
    });

    const response: MessageResponse = {
      currentPage: page,
      totalCount,
      messages: responseMessages,
    };

    return {
      status: ResponseStatus.SUCCESS,
      message: response,
    };
  };

  fetchAllMessages = async (): Promise<ApiResult> => {
    const allMessages: MessageEntity[] = await getAllMessages();

    let messages: Message[] = [];
    if (allMessages) {
      messages = Object.assign(messages, allMessages);
    }

    const response: MessageResponse = {
      totalCount: messages.length,
      messages,
    };

    return {
      status: ResponseStatus.SUCCESS,
      message: response,
    };
  };

  async updateMessage(req: express.Request): Promise<ApiResult> {
    const params = req.body;

    const messageToUpdate: MessageEntity | undefined = await getMessageByUid(
      params.uid
    );
    if (!messageToUpdate) {
      return {
        status: ResponseStatus.NOT_FOUND,
        message: 'Message not found',
      };
    }

    const files = req.files as Express.Multer.File[];
    let newAttachments = [];
    let newReplyTexts = [];

    // Set new message properties
    // eslint-disable-next-line no-restricted-syntax
    for (const property in params) {
      if (Object.prototype.hasOwnProperty.call(params, property)) {
        switch (property) {
          case 'senderName':
            messageToUpdate.senderName = params.senderName;
            break;
          case 'deviceName':
            messageToUpdate.deviceName = params.deviceName;
            break;
          case 'message':
            messageToUpdate.message = params.message;
            break;
          case 'isImportant':
            messageToUpdate.isImportant =
              params.isImportant === 'true'
                ? MessageType.IMPORTANT
                : MessageType.NOT_IMPORTANT;
            break;
          case 'isPinned':
            messageToUpdate.isPinned =
              params.isPinned === 'true'
                ? MessagePriority.PINNED
                : MessagePriority.UNPINNED;
            break;
          case 'expiredAt':
            messageToUpdate.expiredAt = params.expiredAt;
            break;
          case 'attachments':
            newAttachments = JSON.parse(req.body.attachments);
            break;
          case 'replyTexts':
            newReplyTexts = JSON.parse(req.body.replyTexts);
            break;
          case 'replyNumber':
            messageToUpdate.replyNumber = params.replyNumber;
            break;
          default:
            break;
        }
      }
    }

    return this.handleUpdateMessage(files, newAttachments, newReplyTexts, messageToUpdate);
  }

  async deleteMessage(req: express.Request): Promise<ApiResult> {
    const uid = Number(req.query.uid);

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();

    try {
      const message: MessageEntity | undefined = await getMessageByUid(uid);
      if (!message) {
        return {
          status: ResponseStatus.NOT_FOUND,
          message: 'Message not found',
        };
      }
      await queryRunner.startTransaction();

      const { attachments } = message;
      message.status = MessageStatus.DELETED;
      message.deletedAt = this.formatDateTime(new Date());
      delete message.attachments;
      delete message.replyTexts;

      await messageUpdate(message, queryRunner);
      await deleteAttachmentsByMessageId(message.id, queryRunner);
      await deleteReplyTextsByMessageId(message.id, queryRunner);
      await this.clearAttachments(message.id, attachments);
      await queryRunner.commitTransaction();

      this.notifyPlayer();

      return {
        status: ResponseStatus.SUCCESS,
        message: 'Success! Message deleted',
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteAllMessages(): Promise<ApiResult> {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await deleteAttachments(queryRunner);
      await deleteReplyTexts(queryRunner);
      await removeAllMessages(queryRunner);
      await this.clearAttachments();
      await queryRunner.commitTransaction();

      this.notifyPlayer();

      return {
        status: ResponseStatus.SUCCESS,
        message: 'Success! All messages deleted',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async handleOmitMessage(messageId: number, status: MessageStatus) {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let successMessage: string;
      let result: MessageEntity | undefined;
      if (status === MessageStatus.ACTIVE) {
        result = await messageOmit(messageId, queryRunner);
        successMessage = 'Success! Message Omitted';
      } else {
        result = await messageUnOmit(messageId, queryRunner);
        successMessage = 'Success! Undo Omitted Message';
      }

      if (!result) {
        return {
          status: ResponseStatus.NOT_FOUND,
          message: 'Message not found',
        };
      }
      await queryRunner.commitTransaction();

      this.notifyPlayer();

      return {
        status: ResponseStatus.SUCCESS,
        message: successMessage,
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  omitMessage(req: express.Request): Promise<ApiResult> {
    const id = Number(req.query.id);
    const status = MessageStatus.ACTIVE;

    return this.handleOmitMessage(id, status);
  }

  unOmitMessage(req: express.Request): Promise<ApiResult> {
    const id = Number(req.query.id);
    const status = MessageStatus.OMITTED;

    return this.handleOmitMessage(id, status);
  }

  async replyMessage(req: express.Request): Promise<ApiResult> {
    const id = Number(req.query.id);
    const replyNumber = Number(req.query.replyNumber);

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();

    try {
      const message: MessageEntity | undefined = await getMessageById(id);
      if (!message) {
        return {
          status: ResponseStatus.NOT_FOUND,
          message: 'Message not found',
        };
      }
      await queryRunner.startTransaction();

      // 更新に不要なのであらかじめ削除（EntityColumnNotFoundになってしまう）
      delete message.attachments;
      delete message.replyTexts;

      message.replyNumber = replyNumber;

      await messageUpdate(message, queryRunner);
      await queryRunner.commitTransaction();

      this.notifyPlayer();

      return {
        status: ResponseStatus.SUCCESS,
        message: 'Success! Message Replied',
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  setTone = async (request: express.Request): Promise<ApiResult> => {
    const { toneEnabled } = request.query;
    const value = toneEnabled === '1' ? '1' : '0';

    await updateSetting(SettingsKeys.MessageToneEnabled, value);
    const status = Number(toneEnabled) === MessageTone.ENABLED ? 'On' : 'Off';
    return {
      status: ResponseStatus.SUCCESS,
      message: `Success! Message tone set to ${status}`,
    };
  };

  handleExpiredMessages = async () => {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();

    try {
      const messages: MessageEntity[] = await getExpiredMessages();

      if (messages && messages.length) {
        await queryRunner.startTransaction();
        await updateExpiredMessages(messages, queryRunner);
        const messageIds: number[] = [];

        messages.forEach(async (message) => {
          const { id, attachments } = message;
          messageIds.push(id);
          await this.clearAttachments(id, attachments);
        });

        await deleteAttachmentsByMessagesId(messageIds, queryRunner);
        await queryRunner.commitTransaction();

        await this.notifyPlayer();
      }
    } catch (e) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  };
}
