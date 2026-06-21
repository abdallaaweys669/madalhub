import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizerCreditRequests1748600000000 implements MigrationInterface {
  name = 'CreateOrganizerCreditRequests1748600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`organizer_credit_requests\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`organizer_id\` int NOT NULL,
        \`event_id\` int NULL,
        \`event_title\` varchar(255) NULL,
        \`status\` enum('pending','granted','dismissed') NOT NULL DEFAULT 'pending',
        \`credits_granted\` int NOT NULL DEFAULT 0,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`resolved_at\` datetime NULL,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_organizer_credit_requests_organizer\` (\`organizer_id\`),
        KEY \`IDX_organizer_credit_requests_status\` (\`status\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `organizer_credit_requests`');
  }
}
