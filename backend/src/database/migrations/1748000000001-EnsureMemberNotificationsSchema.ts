import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Repairs `member_notifications` when an older/wrong table existed and
 * CreateMemberNotificationsTable1748000000000 skipped CREATE.
 */
export class EnsureMemberNotificationsSchema1748000000001 implements MigrationInterface {
  name = 'EnsureMemberNotificationsSchema1748000000001';

  private async createTable(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`member_notifications\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`user_id\` int NOT NULL,
        \`type\` varchar(64) NOT NULL,
        \`title\` varchar(200) NOT NULL,
        \`body\` varchar(512) NULL,
        \`event_id\` int NULL,
        \`action_route\` varchar(255) NULL,
        \`dedupe_key\` varchar(128) NULL,
        \`read_at\` datetime NULL,
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_member_notifications_user_id\` (\`user_id\`),
        KEY \`IDX_member_notifications_user_read\` (\`user_id\`, \`read_at\`),
        UNIQUE KEY \`UQ_member_notifications_user_dedupe\` (\`user_id\`, \`dedupe_key\`)
      ) ENGINE=InnoDB
    `);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns: Array<{ COLUMN_NAME: string }> = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'member_notifications'
    `);

    const have = new Set(columns.map((row) => row.COLUMN_NAME));
    const required = [
      'id',
      'user_id',
      'type',
      'title',
      'body',
      'event_id',
      'action_route',
      'dedupe_key',
      'read_at',
      'created_at',
    ];

    const schemaOk = required.every((column) => have.has(column));

    if (schemaOk) {
      return;
    }

    await queryRunner.query('DROP TABLE IF EXISTS `member_notifications`');
    await this.createTable(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op: do not drop a repaired production table on revert.
  }
}
