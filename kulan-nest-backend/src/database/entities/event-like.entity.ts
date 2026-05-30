import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('event_likes')
@Unique('UQ_event_likes_event_member', ['eventId', 'memberId'])
export class EventLike {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('IDX_event_likes_event_id')
  @Column({ name: 'event_id' })
  eventId!: number;

  @Index('IDX_event_likes_member_id')
  @Column({ name: 'member_id' })
  memberId!: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;
}
