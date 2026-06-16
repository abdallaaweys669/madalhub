-- Repair member_notifications when table exists with wrong columns.
-- Safe for dev: drops and recreates only when user_id column is missing.

SET @db = DATABASE();

SET @has_user_id = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'member_notifications'
    AND COLUMN_NAME = 'user_id'
);

SET @sql = IF(
  @has_user_id = 0,
  'DROP TABLE IF EXISTS `member_notifications`',
  'SELECT ''member_notifications schema ok'' AS note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_user_id = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'member_notifications'
    AND COLUMN_NAME = 'user_id'
);

SET @sql = IF(
  @has_user_id = 0,
  'CREATE TABLE `member_notifications` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int NOT NULL,
    `type` varchar(64) NOT NULL,
    `title` varchar(200) NOT NULL,
    `body` varchar(512) NULL,
    `event_id` int NULL,
    `action_route` varchar(255) NULL,
    `dedupe_key` varchar(128) NULL,
    `read_at` datetime NULL,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `IDX_member_notifications_user_id` (`user_id`),
    KEY `IDX_member_notifications_user_read` (`user_id`, `read_at`),
    UNIQUE KEY `UQ_member_notifications_user_dedupe` (`user_id`, `dedupe_key`)
  ) ENGINE=InnoDB',
  'SELECT ''member_notifications already exists'' AS note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
