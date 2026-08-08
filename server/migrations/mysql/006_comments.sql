CREATE TABLE IF NOT EXISTS comments (
  id VARCHAR(128) PRIMARY KEY,
  content_type ENUM('activity','need','life') NOT NULL,
  content_id VARCHAR(128) NOT NULL,
  author_id VARCHAR(64) NOT NULL,
  body VARCHAR(500) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  deleted_at DATETIME(3) NULL,
  CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_comments_content_order (content_type,content_id,created_at DESC,id DESC),
  INDEX idx_comments_author_order (author_id,created_at DESC)
);
