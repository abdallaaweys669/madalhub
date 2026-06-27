import { MigrationInterface, QueryRunner } from 'typeorm';

const ORGANIZER_TYPES = [
  { slug: 'company', name: 'Company / Business', icon: 'business-outline', sort_order: 1 },
  { slug: 'startup', name: 'Startup / Tech team', icon: 'rocket-outline', sort_order: 2 },
  { slug: 'ngo', name: 'NGO / Foundation', icon: 'heart-outline', sort_order: 3 },
  { slug: 'government', name: 'Government / Public body', icon: 'library-outline', sort_order: 4 },
  { slug: 'university', name: 'University / College', icon: 'school-outline', sort_order: 5 },
  { slug: 'training', name: 'Training institute', icon: 'book-outline', sort_order: 6 },
  { slug: 'student_club', name: 'Student club / Society', icon: 'people-outline', sort_order: 7 },
  { slug: 'community', name: 'Community group', icon: 'home-outline', sort_order: 8 },
  { slug: 'mosque', name: 'Mosque / Islamic organization', icon: 'moon-outline', sort_order: 9 },
  { slug: 'event_agency', name: 'Event agency / Pro organizer', icon: 'calendar-outline', sort_order: 10 },
  { slug: 'media', name: 'Media / Creator / Influencer', icon: 'mic-outline', sort_order: 11 },
  { slug: 'association', name: 'Professional association', icon: 'briefcase-outline', sort_order: 12 },
  { slug: 'sports', name: 'Sports / Fitness club', icon: 'fitness-outline', sort_order: 13 },
  { slug: 'arts', name: 'Arts / Cultural org', icon: 'color-palette-outline', sort_order: 14 },
  { slug: 'individual', name: 'Individual organizer', icon: 'person-outline', sort_order: 15 },
  { slug: 'other', name: 'Other', icon: 'ellipsis-horizontal-outline', sort_order: 16 },
];

const DOCUMENT_TYPES = [
  { slug: 'business_license', name: 'Business license', icon: 'document-outline', sort_order: 1 },
  { slug: 'event_poster', name: 'Event poster', icon: 'image-outline', sort_order: 2 },
  { slug: 'event_photo', name: 'Previous event photo', icon: 'camera-outline', sort_order: 3 },
  { slug: 'institution_letter', name: 'University / institution letter', icon: 'school-outline', sort_order: 4 },
  { slug: 'other', name: 'Other supporting document', icon: 'attach-outline', sort_order: 5 },
];

export class OrganizerVerificationTypes1749100000000 implements MigrationInterface {
  name = 'OrganizerVerificationTypes1749100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // organizer_types table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`organizer_types\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`slug\` varchar(64) NOT NULL UNIQUE,
        \`name\` varchar(128) NOT NULL,
        \`icon\` varchar(64) NULL,
        \`sort_order\` int NOT NULL DEFAULT 0,
        \`is_active\` tinyint NOT NULL DEFAULT 1,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // organizer_verification_document_types table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`organizer_verification_document_types\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`slug\` varchar(64) NOT NULL UNIQUE,
        \`name\` varchar(128) NOT NULL,
        \`icon\` varchar(64) NULL,
        \`sort_order\` int NOT NULL DEFAULT 0,
        \`is_active\` tinyint NOT NULL DEFAULT 1,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Seed organizer types
    for (const t of ORGANIZER_TYPES) {
      await queryRunner.query(
        `INSERT INTO \`organizer_types\` (\`slug\`, \`name\`, \`icon\`, \`sort_order\`, \`is_active\`)
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`icon\` = VALUES(\`icon\`), \`sort_order\` = VALUES(\`sort_order\`)`,
        [t.slug, t.name, t.icon, t.sort_order],
      );
    }

    // Seed document types
    for (const t of DOCUMENT_TYPES) {
      await queryRunner.query(
        `INSERT INTO \`organizer_verification_document_types\` (\`slug\`, \`name\`, \`icon\`, \`sort_order\`, \`is_active\`)
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`icon\` = VALUES(\`icon\`), \`sort_order\` = VALUES(\`sort_order\`)`,
        [t.slug, t.name, t.icon, t.sort_order],
      );
    }

    // Add organizer_type_id to organizer_profiles
    const hasCols = await queryRunner.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'organizer_profiles'
        AND COLUMN_NAME = 'organizer_type_id'
      LIMIT 1
    `);
    if (!hasCols.length) {
      await queryRunner.query(`
        ALTER TABLE \`organizer_profiles\`
        ADD \`organizer_type_id\` int NULL
      `);
    }

    // Add phone + social link columns to organizer_profiles
    const phoneCol = await queryRunner.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'organizer_profiles'
        AND COLUMN_NAME = 'phone'
      LIMIT 1
    `);
    if (!phoneCol.length) {
      await queryRunner.query(`
        ALTER TABLE \`organizer_profiles\`
        ADD \`phone\` varchar(32) NULL,
        ADD \`facebook\` varchar(256) NULL,
        ADD \`instagram\` varchar(256) NULL
      `);
    }

    // Add document_type_slug to organizer_verification_documents (safe FK alternative)
    const docSlugCol = await queryRunner.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'organizer_verification_documents'
        AND COLUMN_NAME = 'document_type_slug'
      LIMIT 1
    `);
    if (!docSlugCol.length) {
      await queryRunner.query(`
        ALTER TABLE \`organizer_verification_documents\`
        ADD \`document_type_slug\` varchar(64) NULL
      `);
    }

    // Backfill document_type_slug from existing document_type enum values
    await queryRunner.query(`
      UPDATE \`organizer_verification_documents\`
      SET \`document_type_slug\` = CASE
        WHEN \`document_type\` IN ('business_license', 'license') THEN 'business_license'
        ELSE 'other'
      END
      WHERE \`document_type_slug\` IS NULL
    `);
  }

  public async down(): Promise<void> {
    // Non-destructive rollback: lookup tables remain.
  }
}
