import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEventProgramRosterTable1746200000000 implements MigrationInterface {
  name = 'CreateEventProgramRosterTable1746200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'event_program_roster'
      LIMIT 1
    `);

    if (!existing.length) {
      await queryRunner.query(`
        CREATE TABLE \`event_program_roster\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`event_id\` int NOT NULL,
          \`role\` varchar(50) NOT NULL,
          \`display_name\` varchar(255) NOT NULL,
          \`title\` varchar(255) NULL,
          \`sort_order\` int NOT NULL DEFAULT 0,
          \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          KEY \`IDX_event_program_roster_event_id\` (\`event_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'event_program_roster'
      LIMIT 1
    `);

    if (existing.length) {
      await queryRunner.query(`DROP TABLE \`event_program_roster\``);
    }
  }
}
