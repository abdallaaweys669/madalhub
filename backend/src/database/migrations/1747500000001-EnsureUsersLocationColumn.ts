import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `users.location` when missing (VARCHAR 512), matching User.entity.
 * Safe to re-run.
 */
export class EnsureUsersLocationColumn1747500000001 implements MigrationInterface {
  name = 'EnsureUsersLocationColumn1747500000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows: Array<{ COLUMN_NAME: string }> = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'location'
    `);

    if (!rows.length) {
      await queryRunner.query(`
        ALTER TABLE \`users\`
        ADD COLUMN \`location\` varchar(512) NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const rows: Array<{ COLUMN_NAME: string }> = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'location'
    `);

    if (rows.length) {
      await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`location\``);
    }
  }
}
