import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Optional member social / website links on `users`.
 */
export class AddUserSocialLinkColumns1747900000000 implements MigrationInterface {
  name = 'AddUserSocialLinkColumns1747900000000';

  private readonly columns = [
    'social_website',
    'social_linkedin',
    'social_instagram',
    'social_facebook',
    'social_tiktok',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows: Array<{ COLUMN_NAME: string }> = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME IN (${this.columns.map((c) => `'${c}'`).join(', ')})
    `);
    const have = new Set(rows.map((r) => r.COLUMN_NAME));

    for (const column of this.columns) {
      if (!have.has(column)) {
        await queryRunner.query(`
          ALTER TABLE \`users\`
          ADD COLUMN \`${column}\` varchar(512) NULL
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const rows: Array<{ COLUMN_NAME: string }> = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME IN (${this.columns.map((c) => `'${c}'`).join(', ')})
    `);
    const have = new Set(rows.map((r) => r.COLUMN_NAME));

    for (const column of [...this.columns].reverse()) {
      if (have.has(column)) {
        await queryRunner.query(
          `ALTER TABLE \`users\` DROP COLUMN \`${column}\``,
        );
      }
    }
  }
}
