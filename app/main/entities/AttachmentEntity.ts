/* eslint import/no-cycle: off */
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import MessageEntity from './MessageEntity';

@Entity('attachment')
export default class AttachmentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  url!: string;

  @Column('text')
  name!: string;

  @Column('integer')
  assetId!: number;

  @ManyToOne(() => MessageEntity, (message) => message.attachments, {
    eager: true,
    onDelete: 'CASCADE',
  })
  message!: MessageEntity;
}
