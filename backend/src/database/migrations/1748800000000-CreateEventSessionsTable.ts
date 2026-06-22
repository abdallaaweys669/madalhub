import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEventSessionsTable1748800000000 implements MigrationInterface {
  name = 'CreateEventSessionsTable1748800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(`
      SELECT COUNT(*) AS cnt
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'event_sessions'
    `);
    if (Number(tableExists?.[0]?.cnt) > 0) return;

    await queryRunner.query(`
      CREATE TABLE \`event_sessions\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`event_id\` int NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`session_format\` varchar(50) NOT NULL,
        \`start_datetime\` datetime NOT NULL,
        \`end_datetime\` datetime NOT NULL,
        \`description\` text NULL,
        \`speaker_names\` varchar(500) NULL,
        \`sort_order\` int NOT NULL DEFAULT 0,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_event_sessions_event_id\` (\`event_id\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(`
      SELECT COUNT(*) AS cnt
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'event_sessions'
    `);
    if (Number(tableExists?.[0]?.cnt) === 0) return;
    await queryRunner.query(`DROP TABLE \`event_sessions\``);
  }
}
