-- Generated from the canonical MySQL schema. Do not hand-edit table definitions.

-- Regenerate with: npm run db:schema:export -- --output server/migrations/mysql/001_canonical_domain_schema.sql

SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS `activities` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` enum('activity','need','life') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activity',
  `host_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `date_label` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `time` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `starts_at` datetime(3) DEFAULT NULL,
  `ends_at` datetime(3) DEFAULT NULL,
  `timezone` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Asia/Shanghai',
  `location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '上海',
  `district` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `distance` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `description` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` smallint unsigned NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CNY',
  `featured` tinyint(1) NOT NULL DEFAULT '0',
  `note` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `audience` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `pitch` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `boundary` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `match_label` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `lifecycle` enum('pre','formal','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'formal',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_activities_discovery` (`lifecycle`,`featured`,`created_at`),
  KEY `idx_activities_host` (`host_id`,`created_at`),
  KEY `idx_activities_schedule` (`starts_at`,`lifecycle`),
  KEY `idx_activities_city_district` (`city`,`district`,`lifecycle`),
  KEY `fk_activities_content_item` (`id`,`content_type`,`host_id`),
  FULLTEXT KEY `ft_activities_discovery` (`title`,`description`,`location`),
  CONSTRAINT `fk_activities_content_item` FOREIGN KEY (`id`, `content_type`, `host_id`) REFERENCES `content_items` (`id`, `content_type`, `author_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_activities_capacity` CHECK ((`capacity` between 2 and 50)),
  CONSTRAINT `chk_activities_content_type` CHECK ((`content_type` = _utf8mb4'activity')),
  CONSTRAINT `chk_activities_featured` CHECK ((`featured` in (0,1))),
  CONSTRAINT `chk_activities_price` CHECK ((`price` >= 0)),
  CONSTRAINT `chk_activities_schedule` CHECK (((`ends_at` is null) or (`starts_at` is null) or (`ends_at` > `starts_at`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activity_agenda_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `activity_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sequence_no` smallint unsigned NOT NULL,
  `title` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `starts_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_activity_agenda_items_activity_sequence` (`activity_id`,`sequence_no`),
  CONSTRAINT `fk_activity_agenda_items_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activity_feedback` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mood` enum('舒服自然','有点紧张','收获很大','一般般','不太合适') COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(5000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_activity_feedback_activity_user` (`activity_id`,`user_id`),
  KEY `idx_activity_feedback_user` (`user_id`,`created_at`),
  CONSTRAINT `fk_activity_feedback_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_activity_feedback_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activity_interest_signals` (
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `signal_type` enum('consider','not_interested') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `occurrence_count` smallint unsigned NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`,`activity_id`),
  KEY `idx_activity_interest_signals_activity` (`activity_id`,`signal_type`),
  CONSTRAINT `fk_activity_interest_signals_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_activity_interest_signals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_activity_interest_signals_count` CHECK ((`occurrence_count` >= 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activity_members` (
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('interested','joined','cancelled','waitlisted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'joined',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `cancelled_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`user_id`,`activity_id`),
  KEY `idx_members_activity` (`activity_id`,`status`,`created_at`),
  KEY `idx_members_user_status` (`user_id`,`status`,`created_at`),
  CONSTRAINT `fk_members_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activity_need_links` (
  `activity_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `need_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `link_type` enum('response','inspiration') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'response',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`activity_id`,`need_id`),
  KEY `idx_activity_need_links_need` (`need_id`,`link_type`),
  CONSTRAINT `fk_activity_need_links_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_activity_need_links_need` FOREIGN KEY (`need_id`) REFERENCES `needs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activity_proposals` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `host_user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_need_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('draft','submitted','accepted','rejected','withdrawn') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `reviewed_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_at` datetime(3) DEFAULT NULL,
  `review_note` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_activity_proposals_host_status` (`host_user_id`,`status`,`updated_at`),
  KEY `idx_activity_proposals_review` (`status`,`updated_at`),
  KEY `fk_activity_proposals_source_need` (`source_need_id`),
  KEY `fk_activity_proposals_reviewer` (`reviewed_by`),
  CONSTRAINT `fk_activity_proposals_host` FOREIGN KEY (`host_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_activity_proposals_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_activity_proposals_source_need` FOREIGN KEY (`source_need_id`) REFERENCES `needs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `comments` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` enum('activity','need','life') COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `author_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_comments_content_order` (`content_type`,`content_id`,`created_at`,`id`),
  KEY `idx_comments_author_order` (`author_id`,`created_at`),
  KEY `fk_comments_content` (`content_id`,`content_type`),
  CONSTRAINT `fk_comments_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_comments_content` FOREIGN KEY (`content_id`, `content_type`) REFERENCES `content_items` (`id`, `content_type`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `content_audit_events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `content_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` enum('activity','need','life') COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_type` enum('created','edited','lifecycle_changed','status_changed','archived','restored','reported') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `before_data` json DEFAULT NULL,
  `after_data` json DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_content_audit_events_content` (`content_id`,`created_at`),
  KEY `idx_content_audit_events_actor` (`actor_id`,`created_at`),
  KEY `fk_content_audit_events_content` (`content_id`,`content_type`),
  CONSTRAINT `fk_content_audit_events_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_content_audit_events_content` FOREIGN KEY (`content_id`, `content_type`) REFERENCES `content_items` (`id`, `content_type`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `content_bookmarks` (
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` enum('activity','need','life') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`,`content_id`),
  KEY `idx_content_bookmarks_content` (`content_id`,`created_at`),
  KEY `idx_content_bookmarks_user` (`user_id`,`created_at`),
  KEY `fk_content_bookmarks_content` (`content_id`,`content_type`),
  CONSTRAINT `fk_content_bookmarks_content` FOREIGN KEY (`content_id`, `content_type`) REFERENCES `content_items` (`id`, `content_type`) ON DELETE CASCADE,
  CONSTRAINT `fk_content_bookmarks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `content_item_tags` (
  `content_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tag_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` enum('activity','need','life') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`content_id`,`tag_id`),
  KEY `idx_content_item_tags_tag` (`tag_id`,`content_id`),
  KEY `fk_content_item_tags_content` (`content_id`,`content_type`),
  KEY `fk_content_item_tags_tag` (`tag_id`,`content_type`),
  CONSTRAINT `fk_content_item_tags_content` FOREIGN KEY (`content_id`, `content_type`) REFERENCES `content_items` (`id`, `content_type`) ON DELETE CASCADE,
  CONSTRAINT `fk_content_item_tags_tag` FOREIGN KEY (`tag_id`, `content_type`) REFERENCES `content_tags` (`id`, `content_type`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `content_items` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `author_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` enum('activity','need','life') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('draft','pending','approved','rejected','archived','hidden') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'approved',
  `reviewed_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_at` datetime(3) DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `published_at` datetime(3) DEFAULT NULL,
  `archived_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_content_items_id_type` (`id`,`content_type`),
  UNIQUE KEY `uq_content_items_id_type_author` (`id`,`content_type`,`author_id`),
  KEY `idx_content_items_public` (`content_type`,`status`,`published_at`,`created_at`),
  KEY `idx_content_items_author` (`author_id`,`content_type`,`created_at`),
  KEY `idx_content_items_review` (`status`,`updated_at`),
  KEY `fk_content_items_reviewer` (`reviewed_by`),
  CONSTRAINT `fk_content_items_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_content_items_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `content_media` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` enum('activity','need','life') COLLATE utf8mb4_unicode_ci NOT NULL,
  `media_type` enum('image') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'image',
  `url` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alt_text` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_content_media_content_order` (`content_id`,`sort_order`),
  KEY `idx_content_media_content` (`content_id`,`content_type`),
  CONSTRAINT `fk_content_media_content` FOREIGN KEY (`content_id`, `content_type`) REFERENCES `content_items` (`id`, `content_type`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `content_reactions` (
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` enum('activity','need','life') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reaction_type` enum('resonance') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'resonance',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`,`content_id`,`reaction_type`),
  KEY `idx_content_reactions_content` (`content_id`,`reaction_type`,`created_at`),
  KEY `fk_content_reactions_content` (`content_id`,`content_type`),
  CONSTRAINT `fk_content_reactions_content` FOREIGN KEY (`content_id`, `content_type`) REFERENCES `content_items` (`id`, `content_type`) ON DELETE CASCADE,
  CONSTRAINT `fk_content_reactions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `content_reports` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reporter_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` enum('activity','need','life') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` enum('harassment','spam','privacy','safety','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `detail` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `status` enum('open','reviewing','resolved','dismissed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `handled_by` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `handled_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_content_reports_reporter_content` (`reporter_id`,`content_id`),
  KEY `idx_content_reports_status_created` (`status`,`created_at`),
  KEY `fk_content_reports_content` (`content_id`,`content_type`),
  KEY `fk_content_reports_handler` (`handled_by`),
  CONSTRAINT `fk_content_reports_content` FOREIGN KEY (`content_id`, `content_type`) REFERENCES `content_items` (`id`, `content_type`) ON DELETE CASCADE,
  CONSTRAINT `fk_content_reports_handler` FOREIGN KEY (`handled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_content_reports_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `content_share_events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `content_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` enum('activity','need','life') COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `channel` enum('system','copy_link','wechat','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_content_share_events_content` (`content_id`,`created_at`),
  KEY `idx_content_share_events_actor` (`actor_id`,`created_at`),
  KEY `fk_content_share_events_content` (`content_id`,`content_type`),
  CONSTRAINT `fk_content_share_events_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_content_share_events_content` FOREIGN KEY (`content_id`, `content_type`) REFERENCES `content_items` (`id`, `content_type`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `content_tags` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` enum('activity','need','life') COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_content_tags_id_type` (`id`,`content_type`),
  UNIQUE KEY `uq_content_tags_type_slug` (`content_type`,`slug`),
  UNIQUE KEY `uq_content_tags_type_label` (`content_type`,`label`),
  KEY `idx_content_tags_enabled` (`content_type`,`enabled`,`label`),
  CONSTRAINT `chk_content_tags_enabled` CHECK ((`enabled` in (0,1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `favorites` (
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL,
  PRIMARY KEY (`user_id`,`activity_id`),
  KEY `idx_favorites_activity` (`activity_id`,`created_at` DESC),
  CONSTRAINT `fk_favorites_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_favorites_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `life_posts` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` enum('activity','need','life') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'life',
  `author_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '生活分享',
  `body` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `district` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_life_posts_author` (`author_id`,`created_at`),
  KEY `idx_life_posts_kind_created` (`kind`,`created_at`),
  KEY `idx_life_posts_city_district` (`city`,`district`,`created_at`),
  KEY `fk_life_posts_content` (`id`,`content_type`,`author_id`),
  FULLTEXT KEY `ft_life_posts_discovery` (`body`),
  CONSTRAINT `fk_life_posts_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_life_posts_content` FOREIGN KEY (`id`, `content_type`, `author_id`) REFERENCES `content_items` (`id`, `content_type`, `author_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_life_posts_content_type` CHECK ((`content_type` = _utf8mb4'life'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `messages` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `thread_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message_type` enum('text','system') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_messages_thread_created` (`thread_id`,`created_at`,`id`),
  KEY `fk_messages_sender` (`sender_id`),
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_messages_thread` FOREIGN KEY (`thread_id`) REFERENCES `threads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `needs` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` enum('activity','need','life') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'need',
  `author_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `subtitle` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `body` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `district` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_needs_author` (`author_id`,`created_at`),
  KEY `idx_needs_city_district` (`city`,`district`,`created_at`),
  KEY `fk_needs_content` (`id`,`content_type`,`author_id`),
  FULLTEXT KEY `ft_needs_discovery` (`title`,`subtitle`,`body`),
  CONSTRAINT `fk_needs_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_needs_content` FOREIGN KEY (`id`, `content_type`, `author_id`) REFERENCES `content_items` (`id`, `content_type`, `author_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_needs_content_type` CHECK ((`content_type` = _utf8mb4'need'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notification_outbox` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `notification_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_type` enum('upsert','archive') COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` json NOT NULL,
  `published_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_notification_outbox_pending` (`published_at`,`created_at`),
  KEY `idx_notification_outbox_user` (`user_id`,`created_at`),
  KEY `fk_notification_outbox_notification` (`notification_id`),
  CONSTRAINT `fk_notification_outbox_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notification_outbox_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('announcement','system','like','comment','feedback') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_type` enum('activity','need','life','messages','none') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'none',
  `target_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_label` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_content_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_content_type` enum('activity','need','life') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_thread_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `read_at` datetime(3) DEFAULT NULL,
  `archived_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_state` (`user_id`,`archived_at`,`created_at`),
  KEY `idx_notifications_user_unread` (`user_id`,`read_at`,`archived_at`),
  KEY `idx_notifications_target_content` (`target_content_id`,`target_content_type`),
  KEY `idx_notifications_target_thread` (`target_thread_id`),
  KEY `fk_notifications_actor` (`actor_id`),
  CONSTRAINT `fk_notifications_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_notifications_content` FOREIGN KEY (`target_content_id`, `target_content_type`) REFERENCES `content_items` (`id`, `content_type`) ON DELETE SET NULL,
  CONSTRAINT `fk_notifications_thread` FOREIGN KEY (`target_thread_id`) REFERENCES `threads` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_notifications_target` CHECK ((((`target_type` = _utf8mb4'none') and (`target_id` is null)) or (`target_type` <> _utf8mb4'none')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sessions_token_hash` (`token_hash`),
  KEY `idx_sessions_user_expiry` (`user_id`,`expires_at`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `thread_members` (
  `thread_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unread` int unsigned NOT NULL DEFAULT '0',
  `joined_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `last_read_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`thread_id`,`user_id`),
  KEY `idx_thread_members_user` (`user_id`,`joined_at`),
  CONSTRAINT `fk_thread_members_thread` FOREIGN KEY (`thread_id`) REFERENCES `threads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_thread_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `threads` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `image` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_threads_activity` (`activity_id`),
  KEY `idx_threads_created` (`created_at`),
  CONSTRAINT `fk_threads_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_threads_is_system` CHECK ((`is_system` in (0,1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_interest_tags` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tag_kind` enum('profile_tag','preference','intent','scene','barrier') COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_key` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_interest_tags_user_kind_label` (`user_id`,`tag_kind`,`label`),
  KEY `idx_user_interest_tags_user_kind` (`user_id`,`tag_kind`,`sort_order`),
  KEY `idx_user_interest_tags_kind_label` (`tag_kind`,`label`),
  CONSTRAINT `fk_user_interest_tags_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_onboarding_answers` (
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_key` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `answer_order` smallint unsigned NOT NULL DEFAULT '0',
  `answer_value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`,`question_key`,`answer_order`),
  KEY `idx_user_onboarding_answers_question` (`question_key`),
  CONSTRAINT `fk_user_onboarding_answers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_onboarding_progress` (
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `onboarding_version` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'v1',
  `current_step` tinyint unsigned NOT NULL DEFAULT '0',
  `completed_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_onboarding_progress_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_user_onboarding_progress_step` CHECK ((`current_step` between 0 and 3))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_profiles` (
  `user_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` enum('女','男','不透露','自定义') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '不透露',
  `education` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `occupation` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `height_cm` smallint unsigned DEFAULT NULL,
  `city` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `district` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `hometown` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `relationship_status` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `profile_visibility` enum('public','members','private') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'members',
  `contact_visibility` enum('hidden','after_mutual_consent') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'hidden',
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`),
  KEY `idx_user_profiles_city_district` (`city`,`district`),
  CONSTRAINT `fk_user_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_user_profiles_height` CHECK (((`height_cm` is null) or (`height_cm` between 80 and 250)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `bio` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `verified` tinyint(1) NOT NULL DEFAULT '0',
  `role` enum('member','host','operator') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'member',
  `account_status` enum('active','suspended','deleted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_phone` (`phone`),
  KEY `idx_users_role_status` (`role`,`account_status`),
  KEY `idx_users_updated` (`updated_at`),
  CONSTRAINT `chk_users_verified` CHECK ((`verified` in (0,1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;

