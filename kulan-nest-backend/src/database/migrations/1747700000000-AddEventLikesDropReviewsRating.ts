import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventLikesDropReviewsRating1747700000000 implements MigrationInterface {
  name = 'AddEventLikesDropReviewsRating1747700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const likesTable = await queryRunner.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'event_likes'
      LIMIT 1
    `);

    if (!likesTable.length) {
      await queryRunner.query(`
        CREATE TABLE \`event_likes\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`event_id\` int NOT NULL,
          \`member_id\` int NOT NULL,
          \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`UQ_event_likes_event_member\` (\`event_id\`, \`member_id\`),
          KEY \`IDX_event_likes_event_id\` (\`event_id\`),
          KEY \`IDX_event_likes_member_id\` (\`member_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    }

    const ratingCol = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'reviews'
        AND COLUMN_NAME = 'rating'
      LIMIT 1
    `);

    if (ratingCol.length) {
      await queryRunner.query(`ALTER TABLE \`reviews\` DROP COLUMN \`rating\``);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const likesTable = await queryRunner.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'event_likes'
      LIMIT 1
    `);

    if (likesTable.length) {
      await queryRunner.query(`DROP TABLE \`event_likes\``);
    }

    const reviewsTable = await queryRunner.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'reviews'
      LIMIT 1
    `);

    const ratingCol = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'reviews'
        AND COLUMN_NAME = 'rating'
      LIMIT 1
    `);

    if (reviewsTable.length && !ratingCol.length) {
      await queryRunner.query(
        `ALTER TABLE \`reviews\` ADD COLUMN \`rating\` tinyint NULL`,
      );
    }
  }
}
