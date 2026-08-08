CREATE TABLE IF NOT EXISTS content_tags (
  id VARCHAR(128) PRIMARY KEY,
  content_type ENUM('activity','need','life') NOT NULL,
  slug VARCHAR(120) NOT NULL,
  label VARCHAR(120) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_content_tags_type_slug (content_type,slug),
  UNIQUE KEY uq_content_tags_type_label (content_type,label),
  INDEX idx_content_tags_enabled (content_type,enabled,label)
);

CREATE TABLE IF NOT EXISTS content_item_tags (
  content_id VARCHAR(128) NOT NULL,
  tag_id VARCHAR(128) NOT NULL,
  content_type ENUM('activity','need','life') NOT NULL,
  PRIMARY KEY (content_id,tag_id),
  CONSTRAINT fk_content_item_tags_content FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_content_item_tags_tag FOREIGN KEY (tag_id) REFERENCES content_tags(id) ON DELETE RESTRICT,
  INDEX idx_content_item_tags_tag (tag_id,content_id)
);

INSERT INTO content_tags (id,content_type,slug,label,enabled,created_at,updated_at)
VALUES
  ('activity-food','activity','food','饭搭子',1,NOW(3),NOW(3)),
  ('activity-coffee','activity','coffee','咖啡',1,NOW(3),NOW(3)),
  ('activity-sport','activity','sport','运动',1,NOW(3),NOW(3)),
  ('activity-hike','activity','hike','徒步',1,NOW(3),NOW(3)),
  ('activity-art','activity','art','看展',1,NOW(3),NOW(3)),
  ('activity-board','activity','board','桌游',1,NOW(3),NOW(3)),
  ('need-natural','need','natural-chat','自然聊天',1,NOW(3),NOW(3)),
  ('need-small','need','small-group','少人数',1,NOW(3),NOW(3)),
  ('need-weekend','need','weekend','周末',1,NOW(3),NOW(3)),
  ('need-nearby','need','nearby','附近',1,NOW(3),NOW(3)),
  ('need-deep-talk','need','deep-talk','deep talk',1,NOW(3),NOW(3)),
  ('life-weekend','life','weekend','周末的一百种过法',1,NOW(3),NOW(3)),
  ('life-relationship','life','relationship','关系里的松弛感',1,NOW(3),NOW(3))
ON DUPLICATE KEY UPDATE label=VALUES(label),enabled=VALUES(enabled),updated_at=VALUES(updated_at);

INSERT IGNORE INTO content_item_tags (content_id,tag_id,content_type)
SELECT a.id,ct.id,'activity'
  FROM activities a
  JOIN content_tags ct ON ct.content_type='activity' AND ct.label=a.category;
