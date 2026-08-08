CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  category ENUM('announcement','system','like','comment') NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  actor_id VARCHAR(64),
  target_type ENUM('activity','need','messages','none') NOT NULL DEFAULT 'none',
  target_id VARCHAR(128),
  target_label VARCHAR(120),
  read_at DATETIME(3),
  archived_at DATETIME(3),
  created_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_notifications_target CHECK (target_type <> 'none' OR target_id IS NULL),
  INDEX idx_notifications_user_state (user_id, archived_at, created_at DESC),
  INDEX idx_notifications_user_unread (user_id, read_at, archived_at)
);

CREATE TABLE IF NOT EXISTS notification_outbox (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  notification_id VARCHAR(128) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  event_type ENUM('upsert','archive') NOT NULL,
  payload JSON NOT NULL,
  published_at DATETIME(3),
  created_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_notification_outbox_notification FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  INDEX idx_notification_outbox_pending (published_at, created_at),
  INDEX idx_notification_outbox_user (user_id, created_at)
);
