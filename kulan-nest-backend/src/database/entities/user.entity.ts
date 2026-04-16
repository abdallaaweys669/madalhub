import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users') // This must match your actual MySQL table name
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'full_name', length: 100 })
  fullName!: string;

  @Column({ length: 150, unique: true })
  email!: string;

  // Exclude password hash from queries unless explicitly selected
  @Column({ select: false })
  password!: string;

  @Column({ length: 20, nullable: true })
  phone!: string;

  @Column({ name: 'profile_img', nullable: true })
  profileImg!: string;

  @Column({ nullable: true })
  location!: string;

  @Column({ name: 'role_id' })
  roleId!: number;

  @Column({
    type: 'enum',
    enum: ['active', 'pending', 'rejected'],
    default: 'pending',
  })
  status!: string;

  @Column({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'updated_at' })
  updatedAt!: Date;
}