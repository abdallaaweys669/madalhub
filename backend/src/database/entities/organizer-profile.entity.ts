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

  @Column({ name: 'organizer_type_id', type: 'int', nullable: true })
  organizerTypeId!: number | null;

  @Column({ name: 'organizer_type_other', type: 'varchar', length: 128, nullable: true })
  organizerTypeOther!: string | null;

  @Column({ name: 'phone', type: 'varchar', length: 32, nullable: true, unique: true })
  phone!: string | null;

  @Column({ name: 'facebook', type: 'varchar', length: 256, nullable: true })
  facebook!: string | null;

  @Column({ name: 'instagram', type: 'varchar', length: 256, nullable: true })
  instagram!: string | null;

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
