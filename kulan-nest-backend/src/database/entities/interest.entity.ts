import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('interests')
export class Interest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;
}
