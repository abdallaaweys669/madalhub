import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Unique('UQ_event_registrations_member_event', ['eventId', 'memberId'])
@Entity('event_registrations')
export class EventRegistration {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'event_id' })
  eventId!: number;

  @Column({ name: 'member_id' })
  memberId!: number;

  @Column()
  status!: string;

  @Column({ name: 'ticket_qr', nullable: true, type: 'varchar', length: 255 })
  ticketQr!: string | null;

  @Column({ name: 'created_at' })
  createdAt!: Date;
}
