import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizerRejectionReason1746100000000 implements MigrationInterface {
  name = 'AddOrganizerRejectionReason1746100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'organizer_profiles'
        AND COLUMN_NAME = 'rejection_reason'
      LIMIT 1
    `);

    if (!existing.length) {
      await queryRunner.query(`
        ALTER TABLE \`organizer_profiles\`
        ADD \`rejection_reason\` text NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'organizer_profiles'
        AND COLUMN_NAME = 'rejection_reason'
      LIMIT 1
    `);

    if (existing.length) {
      await queryRunner.query(`
        ALTER TABLE \`organizer_profiles\`
        DROP COLUMN \`rejection_reason\`
      `);
    }
  }
}
