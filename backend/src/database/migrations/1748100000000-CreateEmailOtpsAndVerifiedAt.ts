import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmailOtpsAndVerifiedAt1748100000000 implements MigrationInterface {
  name = 'CreateEmailOtpsAndVerifiedAt1748100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const verifiedCol: Array<{ COLUMN_NAME: string }> =
      await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'email_verified_at'
    `);

    if (!verifiedCol.length) {
      await queryRunner.query(`
        ALTER TABLE \`users\`
        ADD COLUMN \`email_verified_at\` datetime NULL
      `);
    }

    const tableRows: Array<{ TABLE_NAME: string }> = await queryRunner.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'email_otps'
    `);

    if (!tableRows.length) {
      await queryRunner.query(`
        CREATE TABLE \`email_otps\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`email\` varchar(150) NOT NULL,
          \`purpose\` enum('signup','login') NOT NULL,
          \`code_hash\` varchar(255) NOT NULL,
          \`expires_at\` datetime NOT NULL,
          \`attempts\` int NOT NULL DEFAULT 0,
          \`last_sent_at\` datetime NOT NULL,
          \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          KEY \`IDX_email_otps_email_purpose\` (\`email\`, \`purpose\`)
        ) ENGINE=InnoDB
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `email_otps`');

    const verifiedCol: Array<{ COLUMN_NAME: string }> =
      await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'email_verified_at'
    `);

    if (verifiedCol.length) {
      await queryRunner.query(`
        ALTER TABLE \`users\` DROP COLUMN \`email_verified_at\`
      `);
    }
  }
}
