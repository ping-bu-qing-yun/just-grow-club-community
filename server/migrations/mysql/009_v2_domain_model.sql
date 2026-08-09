-- Additive v2 domain migration. It intentionally retains legacy tables and data.
-- A separate, manually approved cleanup migration may remove compatibility tables
-- only after isolated MySQL 8 count, role, deep-link, notification and comment checks.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_status ENUM('active','suspended','deleted') NOT NULL DEFAULT 'active' AFTER role;

ALTER TABLE content_items
  ADD UNIQUE KEY uq_content_items_id_type (id,content_type);

ALTER TABLE content_tags
  ADD UNIQUE KEY uq_content_tags_id_type (id,content_type);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id VARCHAR(64) PRIMARY KEY,
  birth_date DATE NULL,
  gender ENUM('女','男','不透露','自定义') NOT NULL DEFAULT '不透露',
  education VARCHAR(64) NOT NULL DEFAULT '',
  occupation VARCHAR(120) NOT NULL DEFAULT '',
  height_cm SMALLINT UNSIGNED NULL,
  city VARCHAR(80) NOT NULL DEFAULT '',
  district VARCHAR(80) NOT NULL DEFAULT '',
  hometown VARCHAR(120) NOT NULL DEFAULT '',
  relationship_status VARCHAR(64) NOT NULL DEFAULT '',
  profile_visibility ENUM('public','members','private') NOT NULL DEFAULT 'members',
  contact_visibility ENUM('hidden','after_mutual_consent') NOT NULL DEFAULT 'hidden',
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_user_profiles_height CHECK (height_cm IS NULL OR height_cm BETWEEN 80 AND 250),
  INDEX idx_user_profiles_city_district (city,district)
);

CREATE TABLE IF NOT EXISTS user_onboarding_progress (
  user_id VARCHAR(64) PRIMARY KEY,
  onboarding_version VARCHAR(32) NOT NULL DEFAULT 'v1',
  current_step TINYINT UNSIGNED NOT NULL DEFAULT 0,
  completed_at DATETIME(3) NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_user_onboarding_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_user_onboarding_progress_step CHECK (current_step BETWEEN 0 AND 3)
);

CREATE TABLE IF NOT EXISTS user_onboarding_answers (
  user_id VARCHAR(64) NOT NULL,
  question_key VARCHAR(160) NOT NULL,
  answer_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  answer_value TEXT NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id,question_key,answer_order),
  CONSTRAINT fk_user_onboarding_answers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_onboarding_answers_question (question_key)
);

CREATE TABLE IF NOT EXISTS user_interest_tags (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  tag_kind ENUM('profile_tag','preference','intent','scene','barrier') NOT NULL,
  label VARCHAR(120) NOT NULL,
  source_key VARCHAR(160) NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_user_interest_tags_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_interest_tags_user_kind_label (user_id,tag_kind,label),
  INDEX idx_user_interest_tags_user_kind (user_id,tag_kind,sort_order)
);

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS content_type ENUM('activity','need','life') NOT NULL DEFAULT 'activity' AFTER id,
  ADD COLUMN IF NOT EXISTS starts_at DATETIME(3) NULL AFTER time,
  ADD COLUMN IF NOT EXISTS ends_at DATETIME(3) NULL AFTER starts_at,
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Shanghai' AFTER ends_at,
  ADD COLUMN IF NOT EXISTS city VARCHAR(80) NOT NULL DEFAULT '上海' AFTER location,
  ADD COLUMN IF NOT EXISTS district VARCHAR(80) NOT NULL DEFAULT '' AFTER city,
  ADD COLUMN IF NOT EXISTS audience VARCHAR(2000) NOT NULL DEFAULT '' AFTER lifecycle,
  ADD COLUMN IF NOT EXISTS pitch VARCHAR(2000) NOT NULL DEFAULT '' AFTER audience,
  ADD COLUMN IF NOT EXISTS boundary VARCHAR(2000) NOT NULL DEFAULT '' AFTER pitch,
  ADD COLUMN IF NOT EXISTS match_label VARCHAR(120) NOT NULL DEFAULT '' AFTER boundary,
  ADD COLUMN IF NOT EXISTS updated_at DATETIME(3) NULL AFTER created_at;

UPDATE activities SET updated_at=created_at WHERE updated_at IS NULL;

ALTER TABLE activities
  ADD CONSTRAINT fk_activities_content_type FOREIGN KEY (id,content_type) REFERENCES content_items(id,content_type) ON DELETE CASCADE;

ALTER TABLE activities
  ADD INDEX idx_activities_discovery (lifecycle,featured,created_at),
  ADD INDEX idx_activities_schedule (starts_at,lifecycle);

ALTER TABLE needs
  ADD COLUMN IF NOT EXISTS content_type ENUM('activity','need','life') NOT NULL DEFAULT 'need' AFTER id,
  ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT '' AFTER content_type,
  ADD COLUMN IF NOT EXISTS subtitle VARCHAR(255) NOT NULL DEFAULT '' AFTER title,
  ADD COLUMN IF NOT EXISTS image VARCHAR(512) NULL AFTER body,
  ADD COLUMN IF NOT EXISTS city VARCHAR(80) NOT NULL DEFAULT '' AFTER image,
  ADD COLUMN IF NOT EXISTS district VARCHAR(80) NOT NULL DEFAULT '' AFTER city;

ALTER TABLE needs
  ADD CONSTRAINT fk_needs_content_type FOREIGN KEY (id,content_type) REFERENCES content_items(id,content_type) ON DELETE CASCADE;

ALTER TABLE life_posts
  ADD COLUMN IF NOT EXISTS content_type ENUM('activity','need','life') NOT NULL DEFAULT 'life' AFTER id,
  ADD COLUMN IF NOT EXISTS kind VARCHAR(64) NOT NULL DEFAULT '生活分享' AFTER content_type,
  ADD COLUMN IF NOT EXISTS city VARCHAR(80) NOT NULL DEFAULT '' AFTER image,
  ADD COLUMN IF NOT EXISTS district VARCHAR(80) NOT NULL DEFAULT '' AFTER city;

ALTER TABLE life_posts
  ADD CONSTRAINT fk_life_posts_content_type FOREIGN KEY (id,content_type) REFERENCES content_items(id,content_type) ON DELETE CASCADE;

ALTER TABLE content_item_tags
  ADD CONSTRAINT fk_content_item_tags_content_type FOREIGN KEY (content_id,content_type) REFERENCES content_items(id,content_type) ON DELETE CASCADE,
  ADD CONSTRAINT fk_content_item_tags_tag_type FOREIGN KEY (tag_id,content_type) REFERENCES content_tags(id,content_type) ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS content_media (
  id VARCHAR(128) PRIMARY KEY,
  content_id VARCHAR(128) NOT NULL,
  content_type ENUM('activity','need','life') NOT NULL,
  media_type ENUM('image') NOT NULL DEFAULT 'image',
  url VARCHAR(512) NOT NULL,
  alt_text VARCHAR(255) NOT NULL DEFAULT '',
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_content_media_content FOREIGN KEY (content_id,content_type) REFERENCES content_items(id,content_type) ON DELETE CASCADE,
  UNIQUE KEY uq_content_media_content_order (content_id,sort_order),
  INDEX idx_content_media_content (content_id,content_type)
);

CREATE TABLE IF NOT EXISTS content_bookmarks (
  user_id VARCHAR(64) NOT NULL,
  content_id VARCHAR(128) NOT NULL,
  content_type ENUM('activity','need','life') NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id,content_id),
  CONSTRAINT fk_content_bookmarks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_content_bookmarks_content FOREIGN KEY (content_id,content_type) REFERENCES content_items(id,content_type) ON DELETE CASCADE,
  INDEX idx_content_bookmarks_content (content_id,created_at),
  INDEX idx_content_bookmarks_user (user_id,created_at)
);

INSERT IGNORE INTO content_bookmarks (user_id,content_id,content_type,created_at)
SELECT f.user_id,f.activity_id,'activity',f.created_at
  FROM favorites f
  JOIN content_items ci ON ci.id=f.activity_id AND ci.content_type='activity';

CREATE TABLE IF NOT EXISTS content_reactions (
  user_id VARCHAR(64) NOT NULL,
  content_id VARCHAR(128) NOT NULL,
  content_type ENUM('activity','need','life') NOT NULL,
  reaction_type ENUM('resonance') NOT NULL DEFAULT 'resonance',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id,content_id,reaction_type),
  CONSTRAINT fk_content_reactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_content_reactions_content FOREIGN KEY (content_id,content_type) REFERENCES content_items(id,content_type) ON DELETE CASCADE,
  INDEX idx_content_reactions_content (content_id,reaction_type,created_at)
);

CREATE TABLE IF NOT EXISTS content_share_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  content_id VARCHAR(128) NOT NULL,
  content_type ENUM('activity','need','life') NOT NULL,
  actor_id VARCHAR(64) NULL,
  channel ENUM('system','copy_link','wechat','other') NOT NULL DEFAULT 'system',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_content_share_events_content FOREIGN KEY (content_id,content_type) REFERENCES content_items(id,content_type) ON DELETE CASCADE,
  CONSTRAINT fk_content_share_events_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_content_share_events_content (content_id,created_at)
);

ALTER TABLE comments
  ADD CONSTRAINT fk_comments_content FOREIGN KEY (content_id,content_type) REFERENCES content_items(id,content_type) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS activity_agenda_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  activity_id VARCHAR(128) NOT NULL,
  sequence_no SMALLINT UNSIGNED NOT NULL,
  title VARCHAR(160) NOT NULL,
  body TEXT NOT NULL,
  starts_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_activity_agenda_items_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  UNIQUE KEY uq_activity_agenda_items_activity_sequence (activity_id,sequence_no)
);

CREATE TABLE IF NOT EXISTS activity_need_links (
  activity_id VARCHAR(128) NOT NULL,
  need_id VARCHAR(128) NOT NULL,
  link_type ENUM('response','inspiration') NOT NULL DEFAULT 'response',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (activity_id,need_id),
  CONSTRAINT fk_activity_need_links_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  CONSTRAINT fk_activity_need_links_need FOREIGN KEY (need_id) REFERENCES needs(id) ON DELETE CASCADE,
  INDEX idx_activity_need_links_need (need_id,link_type)
);

CREATE TABLE IF NOT EXISTS activity_interest_signals (
  user_id VARCHAR(64) NOT NULL,
  activity_id VARCHAR(128) NOT NULL,
  signal_type ENUM('consider','not_interested') NOT NULL,
  reason VARCHAR(255) NULL,
  occurrence_count SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id,activity_id),
  CONSTRAINT fk_activity_interest_signals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_activity_interest_signals_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  INDEX idx_activity_interest_signals_activity (activity_id,signal_type)
);

CREATE TABLE IF NOT EXISTS activity_feedback (
  id VARCHAR(128) PRIMARY KEY,
  activity_id VARCHAR(128) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  mood ENUM('舒服自然','有点紧张','收获很大','一般般','不太合适') NOT NULL,
  note VARCHAR(5000) NOT NULL DEFAULT '',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_activity_feedback_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  CONSTRAINT fk_activity_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_activity_feedback_activity_user (activity_id,user_id)
);

ALTER TABLE threads
  RENAME COLUMN system TO is_system;

ALTER TABLE threads
  ADD COLUMN IF NOT EXISTS updated_at DATETIME(3) NULL AFTER created_at;

UPDATE threads SET updated_at=created_at WHERE updated_at IS NULL;

ALTER TABLE thread_members
  ADD COLUMN IF NOT EXISTS joined_at DATETIME(3) NULL AFTER unread,
  ADD COLUMN IF NOT EXISTS last_read_at DATETIME(3) NULL AFTER joined_at;

UPDATE thread_members tm
  JOIN threads t ON t.id=tm.thread_id
   SET tm.joined_at=t.created_at
 WHERE tm.joined_at IS NULL;

ALTER TABLE thread_members
  ADD INDEX idx_thread_members_user (user_id,joined_at);

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS message_type ENUM('text','system') NOT NULL DEFAULT 'text' AFTER sender_id,
  ADD COLUMN IF NOT EXISTS updated_at DATETIME(3) NULL AFTER created_at,
  ADD COLUMN IF NOT EXISTS deleted_at DATETIME(3) NULL AFTER updated_at;

UPDATE messages SET updated_at=created_at WHERE updated_at IS NULL;

CREATE TABLE IF NOT EXISTS content_reports (
  id VARCHAR(128) PRIMARY KEY,
  reporter_id VARCHAR(64) NOT NULL,
  content_id VARCHAR(128) NOT NULL,
  content_type ENUM('activity','need','life') NOT NULL,
  reason ENUM('harassment','spam','privacy','safety','other') NOT NULL,
  detail VARCHAR(1000) NOT NULL DEFAULT '',
  status ENUM('open','reviewing','resolved','dismissed') NOT NULL DEFAULT 'open',
  handled_by VARCHAR(64) NULL,
  handled_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_content_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_content_reports_content FOREIGN KEY (content_id,content_type) REFERENCES content_items(id,content_type) ON DELETE CASCADE,
  CONSTRAINT fk_content_reports_handler FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_content_reports_reporter_content (reporter_id,content_id),
  INDEX idx_content_reports_status_created (status,created_at)
);

CREATE TABLE IF NOT EXISTS content_audit_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  content_id VARCHAR(128) NOT NULL,
  content_type ENUM('activity','need','life') NOT NULL,
  actor_id VARCHAR(64) NULL,
  event_type ENUM('created','edited','lifecycle_changed','status_changed','archived','restored','reported') NOT NULL,
  reason VARCHAR(1000) NULL,
  before_data JSON NULL,
  after_data JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_content_audit_events_content FOREIGN KEY (content_id,content_type) REFERENCES content_items(id,content_type) ON DELETE CASCADE,
  CONSTRAINT fk_content_audit_events_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_content_audit_events_content (content_id,created_at)
);

ALTER TABLE notifications
  MODIFY COLUMN target_type ENUM('activity','need','life','messages','none') NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS target_content_id VARCHAR(128) NULL AFTER target_label,
  ADD COLUMN IF NOT EXISTS target_content_type ENUM('activity','need','life') NULL AFTER target_content_id,
  ADD COLUMN IF NOT EXISTS target_thread_id VARCHAR(128) NULL AFTER target_content_type;

UPDATE notifications
   SET target_content_id=target_id,
       target_content_type=target_type
 WHERE target_type IN ('activity','need','life') AND target_id IS NOT NULL;

UPDATE notifications
   SET target_thread_id=target_id
 WHERE target_type='messages' AND target_id IS NOT NULL;

ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_content FOREIGN KEY (target_content_id,target_content_type) REFERENCES content_items(id,content_type) ON DELETE SET NULL,
  ADD CONSTRAINT fk_notifications_thread FOREIGN KEY (target_thread_id) REFERENCES threads(id) ON DELETE SET NULL,
  ADD INDEX idx_notifications_target_content (target_content_id,target_content_type),
  ADD INDEX idx_notifications_target_thread (target_thread_id);

ALTER TABLE notification_outbox
  ADD CONSTRAINT fk_notification_outbox_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
