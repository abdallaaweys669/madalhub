import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrganizerDocumentTypeVarchar1749400000000 implements MigrationInterface {
  name = 'OrganizerDocumentTypeVarchar1749400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows = await queryRunner.query(`
      SELECT COLUMN_TYPE AS columnType
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'organizer_verification_documents'
        AND COLUMN_NAME = 'document_type'
      LIMIT 1
    `);

    const columnType = String(rows?.[0]?.columnType || '').toLowerCase();
    if (!columnType.startsWith('enum(')) {
      return;
    }

    await queryRunner.query(`
      UPDATE \`organizer_verification_documents\`
      SET \`document_type_slug\` = \`document_type\`
      WHERE \`document_type_slug\` IS NULL OR TRIM(\`document_type_slug\`) = ''
    `);

    await queryRunner.query(`
      ALTER TABLE \`organizer_verification_documents\`
      MODIFY \`document_type\` varchar(64) NOT NULL
    `);

    await queryRunner.query(`
      UPDATE \`organizer_verification_documents\`
      SET \`document_type\` = \`document_type_slug\`
      WHERE \`document_type_slug\` IS NOT NULL
        AND TRIM(\`document_type_slug\`) != ''
        AND \`document_type\` != \`document_type_slug\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`organizer_verification_documents\`
      MODIFY \`document_type\` enum('business_license','license','other') NOT NULL
    `);
  }
}
