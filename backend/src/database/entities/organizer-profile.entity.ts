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
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  verificationStatus!: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Column({ name: 'created_at' })
  createdAt!: Date;
}
