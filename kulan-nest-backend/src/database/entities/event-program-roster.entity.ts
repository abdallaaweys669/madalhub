import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('event_program_roster')
export class EventProgramRoster {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'event_id', type: 'int' })
  eventId!: number;

  @Column({ name: 'role', type: 'varchar', length: 50 })
  role!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 255 })
  displayName!: string;

  @Column({ name: 'title', type: 'varchar', length: 255, nullable: true })
  title!: string | null;

  @Column({ name: 'photo_url', type: 'varchar', length: 500, nullable: true })
  photoUrl!: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
