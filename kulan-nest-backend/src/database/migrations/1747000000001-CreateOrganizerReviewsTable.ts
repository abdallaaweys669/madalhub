import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizerReviewsTable1747000000001 implements MigrationInterface {
  name = 'CreateOrganizerReviewsTable1747000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'organizer_reviews'
      LIMIT 1
    `);

    if (!existing.length) {
      await queryRunner.query(`
        CREATE TABLE \`organizer_reviews\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`organizer_id\` int NOT NULL,
          \`member_id\` int NOT NULL,
          \`rating\` tinyint NOT NULL,
          \`comment\` text NULL,
          \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`UQ_organizer_reviews_organizer_member\` (\`organizer_id\`, \`member_id\`),
          KEY \`IDX_organizer_reviews_organizer_id\` (\`organizer_id\`),
          KEY \`IDX_organizer_reviews_member_id\` (\`member_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'organizer_reviews'
      LIMIT 1
    `);

    if (existing.length) {
      await queryRunner.query(`DROP TABLE \`organizer_reviews\``);
    }
  }
}
