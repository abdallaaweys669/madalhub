import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('event_sponsors')
export class EventSponsor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  event_id!: number;

  @Column()
  sponsor_name!: string;

  @Column({ nullable: true })
  sponsor_logo!: string;
}