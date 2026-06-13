import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Aligns `users` with User.entity: profile_show_email / profile_show_phone.
 * Fixes: Unknown column 'User.profile_show_email' in 'field list'
 */
export class AddUserProfileVisibilityColumns1747500000000 implements MigrationInterface {
  name = 'AddUserProfileVisibilityColumns1747500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows: Array<{ COLUMN_NAME: string }> = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME IN ('profile_show_email', 'profile_show_phone')
    `);
    const have = new Set(rows.map((r) => r.COLUMN_NAME));

    if (!have.has('profile_show_email')) {
      await queryRunner.query(`
        ALTER TABLE \`users\`
        ADD COLUMN \`profile_show_email\` tinyint(1) NOT NULL DEFAULT 1
      `);
    }

    if (!have.has('profile_show_phone')) {
      await queryRunner.query(`
        ALTER TABLE \`users\`
        ADD COLUMN \`profile_show_phone\` tinyint(1) NOT NULL DEFAULT 1
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const rows: Array<{ COLUMN_NAME: string }> = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME IN ('profile_show_email', 'profile_show_phone')
    `);
    const have = new Set(rows.map((r) => r.COLUMN_NAME));

    if (have.has('profile_show_phone')) {
      await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`profile_show_phone\``);
    }
    if (have.has('profile_show_email')) {
      await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`profile_show_email\``);
    }
  }
}
