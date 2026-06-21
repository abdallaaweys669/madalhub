import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type OrganizerCreditRequestStatus = 'pending' | 'granted' | 'dismissed';

@Entity('organizer_credit_requests')
export class OrganizerCreditRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'organizer_id' })
  organizerId!: number;

  @Column({ name: 'event_id', type: 'int', nullable: true })
  eventId!: number | null;

  @Column({ name: 'event_title', type: 'varchar', length: 255, nullable: true })
  eventTitle!: string | null;

  @Column({
    type: 'enum',
    enum: ['pending', 'granted', 'dismissed'],
    default: 'pending',
  })
  status!: OrganizerCreditRequestStatus;

  @Column({ name: 'credits_granted', type: 'int', default: 0 })
  creditsGranted!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'resolved_at', type: 'datetime', nullable: true })
  resolvedAt!: Date | null;
}
