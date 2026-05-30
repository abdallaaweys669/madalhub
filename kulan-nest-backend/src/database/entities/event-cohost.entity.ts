import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('event_cohosts')
export class EventCohost {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'event_id' })
  eventId!: number;

  @Column({ name: 'user_id' })
  userId!: number;
}
