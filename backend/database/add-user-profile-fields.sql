-- =============================================================================
-- users.profile_show_email / profile_show_phone
-- =============================================================================
-- Your Nest `User` entity expects these columns. If they are missing, every
-- `findOne` on User fails with:
--   Unknown column 'User.profile_show_email' in 'field list'
--
-- Run this whole script in MySQL Workbench against `kulan_db` (safe to re-run).
-- =============================================================================

SET @db := DATABASE();

-- profile_show_email
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_show_email'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE `users` ADD COLUMN `profile_show_email` tinyint(1) NOT NULL DEFAULT 1',
  'SELECT ''column profile_show_email already exists'' AS note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- profile_show_phone
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_show_phone'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE `users` ADD COLUMN `profile_show_phone` tinyint(1) NOT NULL DEFAULT 1',
  'SELECT ''column profile_show_phone already exists'' AS note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
