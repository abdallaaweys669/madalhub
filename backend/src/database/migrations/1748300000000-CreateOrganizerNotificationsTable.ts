import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizerNotificationsTable1748300000000 implements MigrationInterface {
  name = 'CreateOrganizerNotificationsTable1748300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables: Array<{ TABLE_NAME: string }> = await queryRunner.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'organizer_notifications'
    `);

    if (tables.length === 0) {
      await queryRunner.query(`
        CREATE TABLE \`organizer_notifications\` (
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
          KEY \`IDX_organizer_notifications_user_id\` (\`user_id\`),
          KEY \`IDX_organizer_notifications_user_read\` (\`user_id\`, \`read_at\`),
          UNIQUE KEY \`UQ_organizer_notifications_user_dedupe\` (\`user_id\`, \`dedupe_key\`)
        ) ENGINE=InnoDB
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `organizer_notifications`');
  }
}
