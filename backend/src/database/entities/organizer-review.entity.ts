import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Unique('UQ_organizer_reviews_organizer_member', ['organizerId', 'memberId'])
@Entity('organizer_reviews')
export class OrganizerReview {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'organizer_id' })
  organizerId!: number;

  @Column({ name: 'member_id' })
  memberId!: number;

  @Column({ type: 'tinyint' })
  rating!: number;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @Column({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'updated_at' })
  updatedAt!: Date;
}
