import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhotoUrlToEventProgramRoster1746400000000 implements MigrationInterface {
  name = 'AddPhotoUrlToEventProgramRoster1746400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'event_program_roster'
        AND COLUMN_NAME = 'photo_url'
      LIMIT 1
    `);

    if (!existing.length) {
      await queryRunner.query(`
        ALTER TABLE \`event_program_roster\`
        ADD \`photo_url\` varchar(500) NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'event_program_roster'
        AND COLUMN_NAME = 'photo_url'
      LIMIT 1
    `);

    if (existing.length) {
      await queryRunner.query(`
        ALTER TABLE \`event_program_roster\`
        DROP COLUMN \`photo_url\`
      `);
    }
  }
}
