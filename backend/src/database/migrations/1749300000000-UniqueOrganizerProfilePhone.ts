import { MigrationInterface, QueryRunner } from 'typeorm';

export class UniqueOrganizerProfilePhone1749300000000 implements MigrationInterface {
  name = 'UniqueOrganizerProfilePhone1749300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE \`organizer_profiles\`
      SET \`phone\` = NULL
      WHERE \`phone\` IS NOT NULL AND TRIM(\`phone\`) = ''
    `);

    // Keep the earliest user_id when duplicate phones exist (dev/test cleanup).
    await queryRunner.query(`
      UPDATE \`organizer_profiles\` op
      INNER JOIN (
        SELECT \`phone\`, MIN(\`user_id\`) AS keep_user_id
        FROM \`organizer_profiles\`
        WHERE \`phone\` IS NOT NULL AND TRIM(\`phone\`) != ''
        GROUP BY \`phone\`
        HAVING COUNT(*) > 1
      ) dup ON op.\`phone\` = dup.\`phone\` AND op.\`user_id\` != dup.keep_user_id
      SET op.\`phone\` = NULL
    `);

    const existing = await queryRunner.query(`
      SELECT INDEX_NAME FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'organizer_profiles'
        AND INDEX_NAME = 'UQ_organizer_profiles_phone'
      LIMIT 1
    `);

    if (!existing.length) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX \`UQ_organizer_profiles_phone\`
        ON \`organizer_profiles\` (\`phone\`)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`
      SELECT INDEX_NAME FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'organizer_profiles'
        AND INDEX_NAME = 'UQ_organizer_profiles_phone'
      LIMIT 1
    `);

    if (existing.length) {
      await queryRunner.query(`
        DROP INDEX \`UQ_organizer_profiles_phone\` ON \`organizer_profiles\`
      `);
    }
  }
}
