import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('organizer_verification_documents')
export class OrganizerVerificationDocument {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'organizer_id' })
  organizerId!: number;

  @Column({ name: 'document_type' })
  documentType!: string;

  @Column({ name: 'document_path' })
  documentPath!: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status!: string;

  @Column({ name: 'review_note', type: 'text', nullable: true })
  reviewNote!: string | null;

  @Column({ name: 'reviewed_by', type: 'int', nullable: true })
  reviewedBy!: number | null;

  @Column({ name: 'uploaded_at', type: 'datetime' })
  uploadedAt!: Date;

  @Column({ name: 'reviewed_at', type: 'datetime', nullable: true })
  reviewedAt!: Date | null;
}
