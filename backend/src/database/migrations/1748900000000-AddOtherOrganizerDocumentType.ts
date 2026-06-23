import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOtherOrganizerDocumentType1748900000000 implements MigrationInterface {
  name = 'AddOtherOrganizerDocumentType1748900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows = await queryRunner.query(`
      SELECT COLUMN_TYPE AS columnType
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'organizer_verification_documents'
        AND COLUMN_NAME = 'document_type'
      LIMIT 1
    `);

    const columnType = String(rows?.[0]?.columnType || '');
    if (!columnType.toLowerCase().startsWith('enum(')) {
      return;
    }

    const existing = [...columnType.matchAll(/'([^']*)'/g)].map((match) => match[1]);
    const merged = [...new Set([...existing, 'business_license', 'license', 'other'])];
    const enumSql = merged.map((value) => `'${value.replace(/'/g, "''")}'`).join(',');

    await queryRunner.query(`
      ALTER TABLE \`organizer_verification_documents\`
      MODIFY \`document_type\` enum(${enumSql}) NOT NULL
    `);
  }

  public async down(): Promise<void> {
    // Non-destructive: keep expanded enum values.
  }
}
