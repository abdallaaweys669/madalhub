import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates `event_likes` when missing (no FK constraints).
 * The prior migration could record as applied while `CREATE TABLE` failed on FK/engine mismatches;
 * the `DROP COLUMN reviews.rating` step may still have succeeded.
 */
export class EnsureEventLikesTableNoForeignKeys1747710000000 implements MigrationInterface {
  name = 'EnsureEventLikesTableNoForeignKeys1747710000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'event_likes'
      LIMIT 1
    `);

    if (existing.length) {
      return;
    }

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

  public async down(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'event_likes'
      LIMIT 1
    `);

    if (existing.length) {
      await queryRunner.query(`DROP TABLE \`event_likes\``);
    }
  }
}
