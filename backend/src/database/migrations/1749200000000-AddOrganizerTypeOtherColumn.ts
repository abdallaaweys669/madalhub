import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizerTypeOtherColumn1749200000000 implements MigrationInterface {
  name = 'AddOrganizerTypeOtherColumn1749200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasCol = await queryRunner.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'organizer_profiles'
        AND COLUMN_NAME = 'organizer_type_other'
      LIMIT 1
    `);

    if (!hasCol.length) {
      await queryRunner.query(`
        ALTER TABLE \`organizer_profiles\`
        ADD \`organizer_type_other\` varchar(128) NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasCol = await queryRunner.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'organizer_profiles'
        AND COLUMN_NAME = 'organizer_type_other'
      LIMIT 1
    `);

    if (hasCol.length) {
      await queryRunner.query(`
        ALTER TABLE \`organizer_profiles\`
        DROP COLUMN \`organizer_type_other\`
      `);
    }
  }
}
