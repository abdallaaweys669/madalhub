import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventLocationCoordinates1747200000000 implements MigrationInterface {
  name = 'AddEventLocationCoordinates1747200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const latitudeColumn = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'events'
        AND COLUMN_NAME = 'location_latitude'
      LIMIT 1
    `);

    if (!latitudeColumn.length) {
      await queryRunner.query(`
        ALTER TABLE \`events\`
        ADD \`location_latitude\` double NULL
      `);
    }

    const longitudeColumn = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'events'
        AND COLUMN_NAME = 'location_longitude'
      LIMIT 1
    `);

    if (!longitudeColumn.length) {
      await queryRunner.query(`
        ALTER TABLE \`events\`
        ADD \`location_longitude\` double NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const longitudeColumn = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'events'
        AND COLUMN_NAME = 'location_longitude'
      LIMIT 1
    `);

    if (longitudeColumn.length) {
      await queryRunner.query(`
        ALTER TABLE \`events\`
        DROP COLUMN \`location_longitude\`
      `);
    }

    const latitudeColumn = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'events'
        AND COLUMN_NAME = 'location_latitude'
      LIMIT 1
    `);

    if (latitudeColumn.length) {
      await queryRunner.query(`
        ALTER TABLE \`events\`
        DROP COLUMN \`location_latitude\`
      `);
    }
  }
}
