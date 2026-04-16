import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('organizer_verification_documents')
export class OrganizerVerificationDocument {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'organizer_id' })
  organizer_id!: number;

  @Column({ name: 'document_type' })
  document_type!: string;

  @Column({ name: 'document_path' })
  document_path!: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status!: string;

  @Column({ name: 'review_note', type: 'text', nullable: true })
  review_note!: string;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewed_by!: number;

  @Column({ name: 'uploaded_at' })
  uploaded_at!: Date;

  @Column({ name: 'reviewed_at', nullable: true })
  reviewed_at!: Date;
}
