import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type MemberEventInteractionAction =
  | 'viewed'
  | 'opened'
  | 'shared'
  | 'saved'
  | 'registered';

@Entity('member_event_interactions')
export class MemberEventInteraction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'member_id' })
  memberId!: number;

  @Column({ name: 'event_id' })
  eventId!: number;

  @Column({ name: 'interest_id', type: 'int', nullable: true })
  interestId!: number | null;

  @Column({ type: 'varchar', length: 20 })
  action!: MemberEventInteractionAction;

  @Column({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;
}
