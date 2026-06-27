import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('organizer_types')
export class OrganizerType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 128 })
  name!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  icon!: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
