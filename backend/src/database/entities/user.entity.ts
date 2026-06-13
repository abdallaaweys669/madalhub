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

  /** City / region; shown on member profile and home. */
  @Column({ type: 'varchar', length: 512, nullable: true })
  location!: string;

  /** When false, email is hidden on public member profile views. */
  @Column({ name: 'profile_show_email', type: 'boolean', default: true })
  profileShowEmail!: boolean;

  /** When false, phone is hidden on public member profile views. */
  @Column({ name: 'profile_show_phone', type: 'boolean', default: true })
  profileShowPhone!: boolean;

  /** When true, member profile is hidden for other members. */
  @Column({ name: 'profile_hidden', type: 'boolean', default: false })
  profileHidden!: boolean;

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
