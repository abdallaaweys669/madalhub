import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('saved_events')
export class SavedEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ name: 'event_id' })
  eventId!: number;

  @Column({ name: 'saved_at' })
  savedAt!: Date;
}
