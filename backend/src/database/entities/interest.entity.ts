import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('interests')
export class Interest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  icon!: string | null;
}
