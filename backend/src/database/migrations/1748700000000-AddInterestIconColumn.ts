import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInterestIconColumn1748700000000 implements MigrationInterface {
  name = 'AddInterestIconColumn1748700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'interests'
        AND COLUMN_NAME = 'icon'
      LIMIT 1
    `);

    if (!existing.length) {
      await queryRunner.query(`
        ALTER TABLE \`interests\`
        ADD \`icon\` varchar(64) NULL AFTER \`name\`
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'interests'
        AND COLUMN_NAME = 'icon'
      LIMIT 1
    `);

    if (existing.length) {
      await queryRunner.query(`
        ALTER TABLE \`interests\`
        DROP COLUMN \`icon\`
      `);
    }
  }
}
