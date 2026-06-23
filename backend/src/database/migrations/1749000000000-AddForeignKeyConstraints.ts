import { MigrationInterface, QueryRunner } from 'typeorm';

type FkSpec = {
  name: string;
  table: string;
  column: string;
  refTable: string;
  refColumn: string;
  onDelete: 'CASCADE' | 'RESTRICT' | 'SET NULL';
};

/**
 * Adds MySQL foreign keys for the 21 active app tables so ERD tools (Workbench)
 * can draw relationship lines. Skips legacy/unused tables (reviews, notifications, etc.).
 */
export class AddForeignKeyConstraints1749000000000 implements MigrationInterface {
  name = 'AddForeignKeyConstraints1749000000000';

  private async tableExists(
    queryRunner: QueryRunner,
    table: string,
  ): Promise<boolean> {
    const rows = await queryRunner.query(
      `
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      LIMIT 1
    `,
      [table],
    );
    return rows.length > 0;
  }

  private async fkExists(
    queryRunner: QueryRunner,
    table: string,
    constraintName: string,
  ): Promise<boolean> {
    const rows = await queryRunner.query(
      `
      SELECT CONSTRAINT_NAME
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND CONSTRAINT_NAME = ?
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
      LIMIT 1
    `,
      [table, constraintName],
    );
    return rows.length > 0;
  }

  private async addFk(
    queryRunner: QueryRunner,
    spec: FkSpec,
  ): Promise<void> {
    if (!(await this.tableExists(queryRunner, spec.table))) return;
    if (!(await this.tableExists(queryRunner, spec.refTable))) return;
    if (await this.fkExists(queryRunner, spec.table, spec.name)) return;

    await queryRunner.query(`
      ALTER TABLE \`${spec.table}\`
      ADD CONSTRAINT \`${spec.name}\`
      FOREIGN KEY (\`${spec.column}\`)
      REFERENCES \`${spec.refTable}\` (\`${spec.refColumn}\`)
      ON DELETE ${spec.onDelete}
      ON UPDATE CASCADE
    `);
  }

  private async deleteOrphans(
    queryRunner: QueryRunner,
    childTable: string,
    childColumn: string,
    parentTable: string,
    parentColumn: string,
  ): Promise<void> {
    if (!(await this.tableExists(queryRunner, childTable))) return;
    if (!(await this.tableExists(queryRunner, parentTable))) return;

    await queryRunner.query(`
      DELETE c
      FROM \`${childTable}\` c
      LEFT JOIN \`${parentTable}\` p ON p.\`${parentColumn}\` = c.\`${childColumn}\`
      WHERE p.\`${parentColumn}\` IS NULL
    `);
  }

  private async nullOrphanNullableFks(
    queryRunner: QueryRunner,
    childTable: string,
    childColumn: string,
    parentTable: string,
    parentColumn: string,
  ): Promise<void> {
    if (!(await this.tableExists(queryRunner, childTable))) return;
    if (!(await this.tableExists(queryRunner, parentTable))) return;

    await queryRunner.query(`
      UPDATE \`${childTable}\` c
      LEFT JOIN \`${parentTable}\` p ON p.\`${parentColumn}\` = c.\`${childColumn}\`
      SET c.\`${childColumn}\` = NULL
      WHERE c.\`${childColumn}\` IS NOT NULL
        AND p.\`${parentColumn}\` IS NULL
    `);
  }

  private async ensureRolesSeed(queryRunner: QueryRunner): Promise<void> {
    if (!(await this.tableExists(queryRunner, 'roles'))) return;

    await queryRunner.query(`
      INSERT INTO \`roles\` (\`id\`, \`name\`)
      SELECT 1, 'member' FROM DUAL
      WHERE NOT EXISTS (SELECT 1 FROM \`roles\` WHERE \`id\` = 1)
    `);
    await queryRunner.query(`
      INSERT INTO \`roles\` (\`id\`, \`name\`)
      SELECT 2, 'organizer' FROM DUAL
      WHERE NOT EXISTS (SELECT 1 FROM \`roles\` WHERE \`id\` = 2)
    `);
    await queryRunner.query(`
      INSERT INTO \`roles\` (\`id\`, \`name\`)
      SELECT 3, 'admin' FROM DUAL
      WHERE NOT EXISTS (SELECT 1 FROM \`roles\` WHERE \`id\` = 3)
    `);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureRolesSeed(queryRunner);

    // --- Orphan cleanup (required before FK creation) ---
    await this.deleteOrphans(queryRunner, 'member_profiles', 'user_id', 'users', 'id');
    await this.deleteOrphans(queryRunner, 'organizer_profiles', 'user_id', 'users', 'id');
    await this.deleteOrphans(queryRunner, 'member_interests', 'member_id', 'users', 'id');
    await this.deleteOrphans(queryRunner, 'member_interests', 'interest_id', 'interests', 'id');
    await this.deleteOrphans(queryRunner, 'events', 'organizer_id', 'users', 'id');
    await this.deleteOrphans(queryRunner, 'events', 'interest_id', 'interests', 'id');
    await this.deleteOrphans(queryRunner, 'event_registrations', 'event_id', 'events', 'id');
    await this.deleteOrphans(queryRunner, 'event_registrations', 'member_id', 'users', 'id');
    await this.deleteOrphans(queryRunner, 'event_sponsors', 'event_id', 'events', 'id');
    await this.deleteOrphans(queryRunner, 'event_sessions', 'event_id', 'events', 'id');
    await this.deleteOrphans(queryRunner, 'event_program_roster', 'event_id', 'events', 'id');
    await this.deleteOrphans(queryRunner, 'saved_events', 'user_id', 'users', 'id');
    await this.deleteOrphans(queryRunner, 'saved_events', 'event_id', 'events', 'id');
    await this.deleteOrphans(queryRunner, 'event_likes', 'event_id', 'events', 'id');
    await this.deleteOrphans(queryRunner, 'event_likes', 'member_id', 'users', 'id');
    await this.deleteOrphans(queryRunner, 'member_event_interactions', 'member_id', 'users', 'id');
    await this.deleteOrphans(queryRunner, 'member_event_interactions', 'event_id', 'events', 'id');
    await this.nullOrphanNullableFks(
      queryRunner,
      'member_event_interactions',
      'interest_id',
      'interests',
      'id',
    );
    await this.deleteOrphans(
      queryRunner,
      'organizer_verification_documents',
      'organizer_id',
      'users',
      'id',
    );
    await this.nullOrphanNullableFks(
      queryRunner,
      'organizer_verification_documents',
      'reviewed_by',
      'users',
      'id',
    );
    await this.deleteOrphans(
      queryRunner,
      'organizer_payment_requests',
      'organizer_id',
      'users',
      'id',
    );
    await this.deleteOrphans(
      queryRunner,
      'organizer_credit_requests',
      'organizer_id',
      'users',
      'id',
    );
    await this.nullOrphanNullableFks(
      queryRunner,
      'organizer_credit_requests',
      'event_id',
      'events',
      'id',
    );
    await this.deleteOrphans(queryRunner, 'organizer_follows', 'organizer_id', 'users', 'id');
    await this.deleteOrphans(queryRunner, 'organizer_follows', 'member_id', 'users', 'id');
    await this.deleteOrphans(queryRunner, 'organizer_reviews', 'organizer_id', 'users', 'id');
    await this.deleteOrphans(queryRunner, 'organizer_reviews', 'member_id', 'users', 'id');
    await this.deleteOrphans(queryRunner, 'organizer_notifications', 'user_id', 'users', 'id');
    await this.nullOrphanNullableFks(
      queryRunner,
      'organizer_notifications',
      'event_id',
      'events',
      'id',
    );
    await this.deleteOrphans(queryRunner, 'member_notifications', 'user_id', 'users', 'id');
    await this.nullOrphanNullableFks(
      queryRunner,
      'member_notifications',
      'event_id',
      'events',
      'id',
    );
    await this.deleteOrphans(queryRunner, 'event_cohosts', 'event_id', 'events', 'id');
    await this.deleteOrphans(queryRunner, 'event_cohosts', 'user_id', 'users', 'id');

    // Fix invalid role_id values before optional roles FK.
    if (await this.tableExists(queryRunner, 'roles')) {
      await queryRunner.query(`
        UPDATE \`users\` u
        LEFT JOIN \`roles\` r ON r.\`id\` = u.\`role_id\`
        SET u.\`role_id\` = 1
        WHERE r.\`id\` IS NULL
      `);
    }

    const fks: FkSpec[] = [
      // users → roles (legacy table; app uses role_id int)
      {
        name: 'FK_users_role_id',
        table: 'users',
        column: 'role_id',
        refTable: 'roles',
        refColumn: 'id',
        onDelete: 'RESTRICT',
      },
      // 1:1 profile extensions
      {
        name: 'FK_member_profiles_user_id',
        table: 'member_profiles',
        column: 'user_id',
        refTable: 'users',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_organizer_profiles_user_id',
        table: 'organizer_profiles',
        column: 'user_id',
        refTable: 'users',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      // interests junction
      {
        name: 'FK_member_interests_member_id',
        table: 'member_interests',
        column: 'member_id',
        refTable: 'users',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_member_interests_interest_id',
        table: 'member_interests',
        column: 'interest_id',
        refTable: 'interests',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      // events
      {
        name: 'FK_events_organizer_id',
        table: 'events',
        column: 'organizer_id',
        refTable: 'users',
        refColumn: 'id',
        onDelete: 'RESTRICT',
      },
      {
        name: 'FK_events_interest_id',
        table: 'events',
        column: 'interest_id',
        refTable: 'interests',
        refColumn: 'id',
        onDelete: 'RESTRICT',
      },
      // event children
      {
        name: 'FK_event_registrations_event_id',
        table: 'event_registrations',
        column: 'event_id',
        refTable: 'events',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_event_registrations_member_id',
        table: 'event_registrations',
        column: 'member_id',
        refTable: 'users',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_event_sponsors_event_id',
        table: 'event_sponsors',
        column: 'event_id',
        refTable: 'events',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_event_sessions_event_id',
        table: 'event_sessions',
        column: 'event_id',
        refTable: 'events',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_event_program_roster_event_id',
        table: 'event_program_roster',
        column: 'event_id',
        refTable: 'events',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_saved_events_user_id',
        table: 'saved_events',
        column: 'user_id',
        refTable: 'users',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_saved_events_event_id',
        table: 'saved_events',
        column: 'event_id',
        refTable: 'events',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_event_likes_event_id',
        table: 'event_likes',
        column: 'event_id',
        refTable: 'events',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_event_likes_member_id',
        table: 'event_likes',
        column: 'member_id',
        refTable: 'users',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_member_event_interactions_member_id',
        table: 'member_event_interactions',
        column: 'member_id',
        refTable: 'users',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_member_event_interactions_event_id',
        table: 'member_event_interactions',
        column: 'event_id',
        refTable: 'events',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_member_event_interactions_interest_id',
        table: 'member_event_interactions',
        column: 'interest_id',
        refTable: 'interests',
        refColumn: 'id',
        onDelete: 'SET NULL',
      },
      // organizer flows
      {
        name: 'FK_organizer_verification_documents_organizer_id',
        table: 'organizer_verification_documents',
        column: 'organizer_id',
        refTable: 'users',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_organizer_verification_documents_reviewed_by',
        table: 'organizer_verification_documents',
        column: 'reviewed_by',
        refTable: 'users',
        refColumn: 'id',
        onDelete: 'SET NULL',
      },
      {
        name: 'FK_organizer_payment_requests_organizer_id',
        table: 'organizer_payment_requests',
        column: 'organizer_id',
        refTable: 'users',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_organizer_credit_requests_organizer_id',
        table: 'organizer_credit_requests',
        column: 'organizer_id',
        refTable: 'users',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_organizer_credit_requests_event_id',
        table: 'organizer_credit_requests',
        column: 'event_id',
        refTable: 'events',
        refColumn: 'id',
        onDelete: 'SET NULL',
      },
      {
        name: 'FK_organizer_follows_organizer_id',
        table: 'organizer_follows',
        column: 'organizer_id',
        refTable: 'users',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_organizer_follows_member_id',
        table: 'organizer_follows',
        column: 'member_id',
        refTable: 'users',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_organizer_reviews_organizer_id',
        table: 'organizer_reviews',
        column: 'organizer_id',
        refTable: 'users',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_organizer_reviews_member_id',
        table: 'organizer_reviews',
        column: 'member_id',
        refTable: 'users',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      // notifications
      {
        name: 'FK_organizer_notifications_user_id',
        table: 'organizer_notifications',
        column: 'user_id',
        refTable: 'users',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_organizer_notifications_event_id',
        table: 'organizer_notifications',
        column: 'event_id',
        refTable: 'events',
        refColumn: 'id',
        onDelete: 'SET NULL',
      },
      {
        name: 'FK_member_notifications_user_id',
        table: 'member_notifications',
        column: 'user_id',
        refTable: 'users',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_member_notifications_event_id',
        table: 'member_notifications',
        column: 'event_id',
        refTable: 'events',
        refColumn: 'id',
        onDelete: 'SET NULL',
      },
      // future co-hosts table
      {
        name: 'FK_event_cohosts_event_id',
        table: 'event_cohosts',
        column: 'event_id',
        refTable: 'events',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
      {
        name: 'FK_event_cohosts_user_id',
        table: 'event_cohosts',
        column: 'user_id',
        refTable: 'users',
        refColumn: 'id',
        onDelete: 'CASCADE',
      },
    ];

    for (const spec of fks) {
      await this.addFk(queryRunner, spec);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const constraintNames: Array<{ table: string; name: string }> = [
      { table: 'event_cohosts', name: 'FK_event_cohosts_user_id' },
      { table: 'event_cohosts', name: 'FK_event_cohosts_event_id' },
      { table: 'member_notifications', name: 'FK_member_notifications_event_id' },
      { table: 'member_notifications', name: 'FK_member_notifications_user_id' },
      { table: 'organizer_notifications', name: 'FK_organizer_notifications_event_id' },
      { table: 'organizer_notifications', name: 'FK_organizer_notifications_user_id' },
      { table: 'organizer_reviews', name: 'FK_organizer_reviews_member_id' },
      { table: 'organizer_reviews', name: 'FK_organizer_reviews_organizer_id' },
      { table: 'organizer_follows', name: 'FK_organizer_follows_member_id' },
      { table: 'organizer_follows', name: 'FK_organizer_follows_organizer_id' },
      { table: 'organizer_credit_requests', name: 'FK_organizer_credit_requests_event_id' },
      { table: 'organizer_credit_requests', name: 'FK_organizer_credit_requests_organizer_id' },
      { table: 'organizer_payment_requests', name: 'FK_organizer_payment_requests_organizer_id' },
      {
        table: 'organizer_verification_documents',
        name: 'FK_organizer_verification_documents_reviewed_by',
      },
      {
        table: 'organizer_verification_documents',
        name: 'FK_organizer_verification_documents_organizer_id',
      },
      {
        table: 'member_event_interactions',
        name: 'FK_member_event_interactions_interest_id',
      },
      {
        table: 'member_event_interactions',
        name: 'FK_member_event_interactions_event_id',
      },
      {
        table: 'member_event_interactions',
        name: 'FK_member_event_interactions_member_id',
      },
      { table: 'event_likes', name: 'FK_event_likes_member_id' },
      { table: 'event_likes', name: 'FK_event_likes_event_id' },
      { table: 'saved_events', name: 'FK_saved_events_event_id' },
      { table: 'saved_events', name: 'FK_saved_events_user_id' },
      { table: 'event_program_roster', name: 'FK_event_program_roster_event_id' },
      { table: 'event_sessions', name: 'FK_event_sessions_event_id' },
      { table: 'event_sponsors', name: 'FK_event_sponsors_event_id' },
      { table: 'event_registrations', name: 'FK_event_registrations_member_id' },
      { table: 'event_registrations', name: 'FK_event_registrations_event_id' },
      { table: 'events', name: 'FK_events_interest_id' },
      { table: 'events', name: 'FK_events_organizer_id' },
      { table: 'member_interests', name: 'FK_member_interests_interest_id' },
      { table: 'member_interests', name: 'FK_member_interests_member_id' },
      { table: 'organizer_profiles', name: 'FK_organizer_profiles_user_id' },
      { table: 'member_profiles', name: 'FK_member_profiles_user_id' },
      { table: 'users', name: 'FK_users_role_id' },
    ];

    for (const { table, name } of constraintNames) {
      if (!(await this.tableExists(queryRunner, table))) continue;
      if (!(await this.fkExists(queryRunner, table, name))) continue;
      await queryRunner.query(`
        ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${name}\`
      `);
    }
  }
}
