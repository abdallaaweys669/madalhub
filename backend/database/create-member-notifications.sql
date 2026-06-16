-- Member notifications inbox table.
-- Run if migrations are not used.

CREATE TABLE IF NOT EXISTS `member_notifications` (
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
) ENGINE=InnoDB;
