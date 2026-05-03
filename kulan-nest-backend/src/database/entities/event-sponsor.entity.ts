import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('event_sponsors')
export class EventSponsor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'event_id' })
  eventId!: number;

  @Column({ name: 'sponsor_name' })
  sponsorName!: string;

  @Column({ name: 'sponsor_logo', nullable: true })
  sponsorLogo!: string;
}
