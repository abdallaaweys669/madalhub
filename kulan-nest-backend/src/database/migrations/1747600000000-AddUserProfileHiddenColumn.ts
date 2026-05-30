import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `profile_hidden` to users for hide-profile feature.
 */
export class AddUserProfileHiddenColumn1747600000000 implements MigrationInterface {
  name = 'AddUserProfileHiddenColumn1747600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows: Array<{ COLUMN_NAME: string }> = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME IN ('profile_hidden')
    `);
    const have = new Set(rows.map((r) => r.COLUMN_NAME));

    if (!have.has('profile_hidden')) {
      await queryRunner.query(`
        ALTER TABLE \`users\`
        ADD COLUMN \`profile_hidden\` tinyint(1) NOT NULL DEFAULT 0
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const rows: Array<{ COLUMN_NAME: string }> = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME IN ('profile_hidden')
    `);
    const have = new Set(rows.map((r) => r.COLUMN_NAME));

    if (have.has('profile_hidden')) {
      await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`profile_hidden\``);
    }
  }
}
