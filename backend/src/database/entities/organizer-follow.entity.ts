import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Unique('UQ_organizer_follows_organizer_member', ['organizerId', 'memberId'])
@Entity('organizer_follows')
export class OrganizerFollow {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'organizer_id' })
  organizerId!: number;

  @Column({ name: 'member_id' })
  memberId!: number;

  @Column({ name: 'created_at' })
  createdAt!: Date;
}
