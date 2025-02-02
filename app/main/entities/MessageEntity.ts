/* eslint import/no-cycle: off */
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import AttachmentEntity from './AttachmentEntity';
import ReplyTextEntity from './ReplyTextEntity';

@Entity('message')
export default class MessageEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('integer')
  uid!: number;

  @Column('text')
  deviceName!: string;

  @Column('text')
  senderName!: string;

  @Column('text')
  message!: string;

  @Column({
    type: 'integer',
    default: 0,
  })
  isImportant!: number;

  @Column({
    type: 'integer',
    default: 0,
  })
  isPinned!: number;

  @Column({
    type: 'integer',
    default: 1,
  })
  status!: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  deletedAt!: string;

  @Column('text')
  hostId!: string;

  @Column('text')
  serialNumber!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  expiredAt!: string;

  @Column('text')
  timeSent!: string;

  @Column('text')
  createdTime!: string;

  @Column({
    type: 'integer',
    default: 0,
  })
  replyNumber!: number;

  @OneToMany(() => AttachmentEntity, (attachment) => attachment.message)
  attachments!: AttachmentEntity[];

  @OneToMany(() => ReplyTextEntity, (replyText) => replyText.message)
  replyTexts!: ReplyTextEntity[];

}
