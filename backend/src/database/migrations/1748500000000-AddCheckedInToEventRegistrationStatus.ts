import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCheckedInToEventRegistrationStatus1748500000000
  implements MigrationInterface
{
  name = 'AddCheckedInToEventRegistrationStatus1748500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`event_registrations\`
       MODIFY COLUMN \`status\` ENUM('registered','attended','cancelled','checked_in')
         NOT NULL DEFAULT 'registered'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Convert any checked_in rows back to attended before removing the value
    await queryRunner.query(
      `UPDATE \`event_registrations\` SET \`status\` = 'attended' WHERE \`status\` = 'checked_in'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`event_registrations\`
       MODIFY COLUMN \`status\` ENUM('registered','attended','cancelled')
         NOT NULL DEFAULT 'registered'`,
    );
  }
}
