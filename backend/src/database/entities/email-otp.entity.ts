import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type EmailOtpPurpose = 'signup' | 'login';

@Entity('email_otps')
@Index(['email', 'purpose'])
export class EmailOtp {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 150 })
  email!: string;

  @Column({ type: 'enum', enum: ['signup', 'login'] })
  purpose!: EmailOtpPurpose;

  @Column({ name: 'code_hash', length: 255 })
  codeHash!: string;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt!: Date;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ name: 'last_sent_at', type: 'datetime' })
  lastSentAt!: Date;

  @Column({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;
}
