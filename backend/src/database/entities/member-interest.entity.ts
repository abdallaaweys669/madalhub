import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('member_interests')
export class MemberInterest {
  @PrimaryColumn({ name: 'member_id' })
  userId!: number;

  @PrimaryColumn({ name: 'interest_id' })
  interestId!: number;
}
