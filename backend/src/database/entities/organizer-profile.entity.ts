import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('organizer_profiles')
export class OrganizerProfile {
  @PrimaryColumn({ name: 'user_id' })
  userId!: number;

  @Column({ name: 'organization_name' })
  organizationName!: string;

  @Column({ name: 'organization_description', type: 'text', nullable: true })
  organizationDescription!: string | null;

  @Column({ name: 'website', type: 'varchar', nullable: true })
  website!: string | null;

  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: ['unverified', 'pending', 'approved', 'rejected'],
    default: 'unverified',
  })
  verificationStatus!: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Column({ name: 'free_publish_used', type: 'boolean', default: false })
  freePublishUsed!: boolean;

  @Column({ name: 'paid_publish_credits', type: 'int', default: 0 })
  paidPublishCredits!: number;

  @Column({ name: 'created_at' })
  createdAt!: Date;
}
