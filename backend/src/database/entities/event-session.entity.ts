import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('event_sessions')
export class EventSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'event_id', type: 'int' })
  eventId!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'session_format', type: 'varchar', length: 50 })
  sessionFormat!: string;

  @Column({ name: 'start_datetime', type: 'datetime' })
  startDatetime!: Date;

  @Column({ name: 'end_datetime', type: 'datetime' })
  endDatetime!: Date;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /** Comma-separated speaker names linked to roster display names. */
  @Column({ name: 'speaker_names', type: 'varchar', length: 500, nullable: true })
  speakerNames!: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
