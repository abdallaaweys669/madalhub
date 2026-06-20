import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventAudienceGender1748400000000 implements MigrationInterface {
  name = 'AddEventAudienceGender1748400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'events'
        AND COLUMN_NAME = 'audience_gender'
      LIMIT 1
    `);

    if (!existing.length) {
      await queryRunner.query(`
        ALTER TABLE \`events\`
        ADD \`audience_gender\` varchar(20) NOT NULL DEFAULT 'all'
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'events'
        AND COLUMN_NAME = 'audience_gender'
      LIMIT 1
    `);

    if (existing.length) {
      await queryRunner.query(`
        ALTER TABLE \`events\`
        DROP COLUMN \`audience_gender\`
      `);
    }
  }
}
