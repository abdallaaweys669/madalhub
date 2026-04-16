import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'organizer_id' })
  organizerId!: number;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'interest_id' })
  interestId!: number;

  @Column({ name: 'is_physical' })
  isPhysical!: boolean;

  @Column({ name: 'start_datetime' })
  startDatetime!: Date;

  @Column({ name: 'end_datetime' })
  endDatetime!: Date;

  @Column({ name: 'location_name', nullable: true })
  locationName!: string;

  @Column({ name: 'location_address', nullable: true })
  locationAddress!: string;

  @Column({ name: 'cover_image', nullable: true })
  coverImage!: string;

  @Column({ name: 'total_price', default: 0 })
  totalPrice!: number;

  @Column({ default: 0 })
  capacity!: number;

  @Column({
    type: 'enum',
    enum: ['draft', 'published', 'cancelled'],
    default: 'draft',
  })
  status!: string;

  @Column({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'updated_at' })
  updatedAt!: Date;
}