import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ name: 'ticket_qr', nullable: true })
  ticketQr!: string;

  @Column({ name: 'created_at' })
  createdAt!: Date;
}