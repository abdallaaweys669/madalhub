import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('organizer_profiles')
export class OrganizerProfile {
  @PrimaryColumn({ name: 'user_id' })
  user_id!: number;

  @Column({ name: 'organization_name' })
  organization_name!: string;

  @Column({ name: 'organization_description', type: 'text' })
  organization_description!: string;

  @Column({ name: 'website' })
  website!: string;

  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  verification_status!: string;

  @Column({ name: 'created_at' })
  created_at!: Date;
}
