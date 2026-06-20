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

  @Column({
    name: 'location_name',
    nullable: true,
    type: 'varchar',
    length: 255,
  })
  locationName!: string | null;

  @Column({ name: 'location_address', nullable: true, type: 'text' })
  locationAddress!: string | null;

  @Column({ name: 'location_latitude', nullable: true, type: 'double' })
  locationLatitude!: number | null;

  @Column({ name: 'location_longitude', nullable: true, type: 'double' })
  locationLongitude!: number | null;

  @Column({ name: 'cover_image', nullable: true, type: 'varchar', length: 500 })
  coverImage!: string | null;

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

  @Column({
    name: 'event_format',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  eventFormat!: string | null;

  @Column({
    name: 'audience_gender',
    type: 'varchar',
    length: 20,
    default: 'all',
  })
  audienceGender!: string;

  @Column({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'updated_at' })
  updatedAt!: Date;
}
