import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizerFollowsTable1747000000000 implements MigrationInterface {
  name = 'CreateOrganizerFollowsTable1747000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'organizer_follows'
      LIMIT 1
    `);

    if (!existing.length) {
      await queryRunner.query(`
        CREATE TABLE \`organizer_follows\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`organizer_id\` int NOT NULL,
          \`member_id\` int NOT NULL,
          \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`UQ_organizer_follows_organizer_member\` (\`organizer_id\`, \`member_id\`),
          KEY \`IDX_organizer_follows_organizer_id\` (\`organizer_id\`),
          KEY \`IDX_organizer_follows_member_id\` (\`member_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'organizer_follows'
      LIMIT 1
    `);

    if (existing.length) {
      await queryRunner.query(`DROP TABLE \`organizer_follows\``);
    }
  }
}
