ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(16) NOT NULL DEFAULT 'user';

UPDATE users
   SET role=CASE LOWER(role)
     WHEN 'operator' THEN 'admin'
     WHEN 'admin' THEN 'admin'
     WHEN 'member' THEN 'user'
     WHEN 'host' THEN 'user'
     ELSE 'user'
   END;

ALTER TABLE users
  MODIFY COLUMN role ENUM('admin','user') NOT NULL DEFAULT 'user';

CREATE TABLE IF NOT EXISTS content_items (
  id VARCHAR(128) PRIMARY KEY,
  author_id VARCHAR(64) NOT NULL,
  content_type ENUM('activity','need','life') NOT NULL,
  status ENUM('draft','pending','approved','rejected','archived') NOT NULL DEFAULT 'pending',
  reviewed_by VARCHAR(64),
  reviewed_at DATETIME(3),
  rejection_reason TEXT,
  published_at DATETIME(3),
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_content_items_author FOREIGN KEY (author_id) REFERENCES users(id),
  CONSTRAINT fk_content_items_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_content_items_public (content_type,status,created_at DESC),
  INDEX idx_content_items_author (author_id,content_type,created_at DESC),
  INDEX idx_content_items_review (status,updated_at DESC)
);

CREATE TABLE IF NOT EXISTS needs (
  id VARCHAR(128) PRIMARY KEY,
  body TEXT NOT NULL,
  author_id VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_needs_content FOREIGN KEY (id) REFERENCES content_items(id) ON DELETE RESTRICT,
  CONSTRAINT fk_needs_author FOREIGN KEY (author_id) REFERENCES users(id),
  INDEX idx_needs_author (author_id,created_at DESC)
);

CREATE TABLE IF NOT EXISTS life_posts (
  id VARCHAR(128) PRIMARY KEY,
  body TEXT NOT NULL,
  image VARCHAR(512),
  author_id VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_life_posts_content FOREIGN KEY (id) REFERENCES content_items(id) ON DELETE RESTRICT,
  CONSTRAINT fk_life_posts_author FOREIGN KEY (author_id) REFERENCES users(id),
  INDEX idx_life_posts_author (author_id,created_at DESC)
);

INSERT IGNORE INTO content_items
  (id,author_id,content_type,status,published_at,created_at,updated_at)
SELECT a.id,a.host_id,'activity','approved',a.created_at,a.created_at,a.created_at
  FROM activities a;

UPDATE users SET role='admin' WHERE id='me';
