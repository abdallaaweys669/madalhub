import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrganizerProgressiveVerificationAndPayments1748200000000
  implements MigrationInterface
{
  name = 'OrganizerProgressiveVerificationAndPayments1748200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`organizer_profiles\`
      MODIFY \`verification_status\` enum('unverified','pending','approved','rejected')
      NOT NULL DEFAULT 'unverified'
    `);

    const freeCol = await queryRunner.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'organizer_profiles'
        AND COLUMN_NAME = 'free_publish_used' LIMIT 1
    `);
    if (!freeCol.length) {
      await queryRunner.query(`
        ALTER TABLE \`organizer_profiles\`
        ADD \`free_publish_used\` tinyint NOT NULL DEFAULT 0
      `);
    }

    const creditsCol = await queryRunner.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'organizer_profiles'
        AND COLUMN_NAME = 'paid_publish_credits' LIMIT 1
    `);
    if (!creditsCol.length) {
      await queryRunner.query(`
        ALTER TABLE \`organizer_profiles\`
        ADD \`paid_publish_credits\` int NOT NULL DEFAULT 0
      `);
    }

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`organizer_payment_requests\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`organizer_id\` int NOT NULL,
        \`plan\` enum('single','bundle') NOT NULL,
        \`amount_usd\` decimal(10,2) NOT NULL,
        \`payment_reference\` varchar(120) NULL,
        \`note\` text NULL,
        \`status\` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
        \`credits_granted\` int NOT NULL DEFAULT 0,
        \`admin_note\` text NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_organizer_payment_requests_organizer\` (\`organizer_id\`),
        KEY \`IDX_organizer_payment_requests_status\` (\`status\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      UPDATE \`users\` SET \`status\` = 'active' WHERE \`role_id\` = 2
    `);

    await queryRunner.query(`
      UPDATE \`organizer_profiles\` op
      SET \`free_publish_used\` = 1
      WHERE op.\`verification_status\` = 'approved'
        AND EXISTS (
          SELECT 1 FROM \`events\` e
          WHERE e.\`organizer_id\` = op.\`user_id\` AND e.\`status\` = 'published'
        )
    `);

    await queryRunner.query(`
      UPDATE \`organizer_profiles\` op
      SET \`verification_status\` = 'unverified'
      WHERE op.\`verification_status\` = 'pending'
        AND (
          TRIM(COALESCE(op.\`organization_name\`, '')) = ''
          OR TRIM(COALESCE(op.\`organization_description\`, '')) = ''
          OR NOT EXISTS (
            SELECT 1 FROM \`organizer_verification_documents\` d
            WHERE d.\`organizer_id\` = op.\`user_id\`
          )
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`organizer_payment_requests\``);

    const creditsCol = await queryRunner.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'organizer_profiles'
        AND COLUMN_NAME = 'paid_publish_credits' LIMIT 1
    `);
    if (creditsCol.length) {
      await queryRunner.query(`
        ALTER TABLE \`organizer_profiles\` DROP COLUMN \`paid_publish_credits\`
      `);
    }

    const freeCol = await queryRunner.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'organizer_profiles'
        AND COLUMN_NAME = 'free_publish_used' LIMIT 1
    `);
    if (freeCol.length) {
      await queryRunner.query(`
        ALTER TABLE \`organizer_profiles\` DROP COLUMN \`free_publish_used\`
      `);
    }

    await queryRunner.query(`
      UPDATE \`organizer_profiles\`
      SET \`verification_status\` = 'pending'
      WHERE \`verification_status\` = 'unverified'
    `);

    await queryRunner.query(`
      ALTER TABLE \`organizer_profiles\`
      MODIFY \`verification_status\` enum('pending','approved','rejected')
      NOT NULL DEFAULT 'pending'
    `);
  }
}
