/* eslint import/no-cycle: off */
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import MessageEntity from './MessageEntity';

@Entity('reply_text')
export default class ReplyTextEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  text!: string;

  @ManyToOne(() => MessageEntity, (message) => message.replyTexts, {
    eager: true,
    onDelete: 'CASCADE',
  })
  message!: MessageEntity;
}
