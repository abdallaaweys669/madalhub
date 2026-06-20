import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('organizer_notifications')
export class OrganizerNotification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ length: 64 })
  type!: string;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  body!: string | null;

  @Column({ name: 'event_id', type: 'int', nullable: true })
  eventId!: number | null;

  @Column({
    name: 'action_route',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  actionRoute!: string | null;

  @Column({ name: 'dedupe_key', type: 'varchar', length: 128, nullable: true })
  dedupeKey!: string | null;

  @Column({ name: 'read_at', type: 'datetime', nullable: true })
  readAt!: Date | null;

  @Column({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;
}
