import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueEventRegistrationMemberEvent1746092100000 implements MigrationInterface {
  name = 'AddUniqueEventRegistrationMemberEvent1746092100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE er1
      FROM event_registrations er1
      INNER JOIN event_registrations er2
        ON er1.event_id = er2.event_id
       AND er1.member_id = er2.member_id
       AND er1.id > er2.id
    `);

    const existing = await queryRunner.query(`
      SELECT INDEX_NAME
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'event_registrations'
        AND INDEX_NAME = 'UQ_event_registrations_member_event'
      LIMIT 1
    `);

    if (!existing.length) {
      await queryRunner.query(`
        ALTER TABLE event_registrations
        ADD CONSTRAINT UQ_event_registrations_member_event
        UNIQUE (event_id, member_id)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(`
      SELECT INDEX_NAME
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'event_registrations'
        AND INDEX_NAME = 'UQ_event_registrations_member_event'
      LIMIT 1
    `);

    if (existing.length) {
      await queryRunner.query(`
        ALTER TABLE event_registrations
        DROP INDEX UQ_event_registrations_member_event
      `);
    }
  }
}
