-- Optional social / website links on users (member profiles).
-- Run if migrations are not used, or column errors appear on save.

SET @db = DATABASE();

-- social_website
SET @exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'social_website'
);
SET @sql = IF(
  @exists = 0,
  'ALTER TABLE `users` ADD COLUMN `social_website` varchar(512) NULL',
  'SELECT ''column social_website already exists'' AS note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- social_linkedin
SET @exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'social_linkedin'
);
SET @sql = IF(
  @exists = 0,
  'ALTER TABLE `users` ADD COLUMN `social_linkedin` varchar(512) NULL',
  'SELECT ''column social_linkedin already exists'' AS note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- social_instagram
SET @exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'social_instagram'
);
SET @sql = IF(
  @exists = 0,
  'ALTER TABLE `users` ADD COLUMN `social_instagram` varchar(512) NULL',
  'SELECT ''column social_instagram already exists'' AS note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- social_facebook
SET @exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'social_facebook'
);
SET @sql = IF(
  @exists = 0,
  'ALTER TABLE `users` ADD COLUMN `social_facebook` varchar(512) NULL',
  'SELECT ''column social_facebook already exists'' AS note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- social_tiktok
SET @exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'social_tiktok'
);
SET @sql = IF(
  @exists = 0,
  'ALTER TABLE `users` ADD COLUMN `social_tiktok` varchar(512) NULL',
  'SELECT ''column social_tiktok already exists'' AS note'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
