import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('settings')
export default class SettingsEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  key!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  value!: string;
}
