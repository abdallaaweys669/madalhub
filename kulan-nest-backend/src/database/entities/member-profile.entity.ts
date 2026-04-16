import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('member_profiles')
export class MemberProfile {
  @PrimaryColumn({ name: 'user_id' })
  userId!: number;

  @Column({ nullable: true })
  gender!: string;

  @Column({ type: 'date', nullable: true })
  dob!: Date;

  @Column({ name: 'profile_completed', default: false })
  profileCompleted!: boolean;
}
