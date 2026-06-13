import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMemberEventInteractionsTable1747800000000 implements MigrationInterface {
  name = 'CreateMemberEventInteractionsTable1747800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'member_event_interactions'
      LIMIT 1
    `);

    if (existing.length) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE \`member_event_interactions\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`member_id\` int NOT NULL,
        \`event_id\` int NOT NULL,
        \`interest_id\` int NULL,
        \`action\` varchar(20) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_member_event_interactions_member_id\` (\`member_id\`),
        KEY \`IDX_member_event_interactions_event_id\` (\`event_id\`),
        KEY \`IDX_member_event_interactions_interest_id\` (\`interest_id\`),
        KEY \`IDX_member_event_interactions_action\` (\`action\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'member_event_interactions'
      LIMIT 1
    `);

    if (existing.length) {
      await queryRunner.query(`DROP TABLE \`member_event_interactions\``);
    }
  }
}
