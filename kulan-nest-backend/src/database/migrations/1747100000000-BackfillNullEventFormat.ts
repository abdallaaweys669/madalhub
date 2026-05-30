import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Legacy rows created before `event_format` was persisted default to NULL so public detail UIs
 * could not show Seminar / Workshop / Meetup. Seed a neutral default; organizers can change via PATCH.
 */
export class BackfillNullEventFormat1747100000000 implements MigrationInterface {
  name = 'BackfillNullEventFormat1747100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE \`events\`
      SET \`event_format\` = 'meetup'
      WHERE \`event_format\` IS NULL OR TRIM(\`event_format\`) = ''
    `);
  }

  public async down(): Promise<void> {
    /* Data backfill is not safely reversible without storing prior values. */
  }
}
