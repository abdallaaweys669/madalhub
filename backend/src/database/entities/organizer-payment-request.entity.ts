import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type OrganizerPaymentPlan = 'single' | 'bundle';
export type OrganizerPaymentRequestStatus = 'pending' | 'approved' | 'rejected';

@Entity('organizer_payment_requests')
export class OrganizerPaymentRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'organizer_id' })
  organizerId!: number;

  @Column({
    type: 'enum',
    enum: ['single', 'bundle'],
  })
  plan!: OrganizerPaymentPlan;

  @Column({ name: 'amount_usd', type: 'decimal', precision: 10, scale: 2 })
  amountUsd!: string;

  @Column({
    name: 'payment_reference',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  paymentReference!: string | null;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status!: OrganizerPaymentRequestStatus;

  @Column({ name: 'credits_granted', type: 'int', default: 0 })
  creditsGranted!: number;

  @Column({ name: 'admin_note', type: 'text', nullable: true })
  adminNote!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
