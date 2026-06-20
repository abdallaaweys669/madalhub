import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('event_cohosts')
export class EventCohost {
  @PrimaryColumn({ name: 'event_id' })
  eventId!: number;

  @PrimaryColumn({ name: 'user_id' })
  userId!: number;
}
