CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  phone VARCHAR(32) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name VARCHAR(120) NOT NULL,
  avatar VARCHAR(512) NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  INDEX idx_users_updated (updated_at)
);

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user_expiry (user_id, expires_at)
);

CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(128) PRIMARY KEY,
  host_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  category ENUM('饭搭子','咖啡','运动','徒步','看展','桌游') NOT NULL,
  image VARCHAR(512) NOT NULL,
  date_label VARCHAR(120) NOT NULL,
  time VARCHAR(16) NOT NULL,
  location VARCHAR(255) NOT NULL,
  distance VARCHAR(64) NOT NULL,
  description TEXT NOT NULL,
  capacity INT NOT NULL,
  price INT NOT NULL,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  created_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_activities_host FOREIGN KEY (host_id) REFERENCES users(id),
  CONSTRAINT chk_activities_capacity CHECK (capacity BETWEEN 2 AND 50),
  CONSTRAINT chk_activities_price CHECK (price >= 0),
  INDEX idx_activities_order (featured DESC, created_at DESC),
  INDEX idx_activities_host (host_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id VARCHAR(64) NOT NULL,
  activity_id VARCHAR(128) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (user_id, activity_id),
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  INDEX idx_favorites_activity (activity_id, created_at DESC)
);

CREATE TABLE IF NOT EXISTS activity_members (
  user_id VARCHAR(64) NOT NULL,
  activity_id VARCHAR(128) NOT NULL,
  status ENUM('joined') NOT NULL DEFAULT 'joined',
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (user_id, activity_id),
  CONSTRAINT fk_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_members_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  INDEX idx_members_activity (activity_id, status, created_at)
);

CREATE TABLE IF NOT EXISTS threads (
  id VARCHAR(128) PRIMARY KEY,
  activity_id VARCHAR(128) UNIQUE,
  title VARCHAR(255) NOT NULL,
  system TINYINT(1) NOT NULL DEFAULT 0,
  image VARCHAR(512),
  created_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_threads_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  INDEX idx_threads_created (created_at DESC)
);

CREATE TABLE IF NOT EXISTS thread_members (
  thread_id VARCHAR(128) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  unread INT NOT NULL DEFAULT 0,
  PRIMARY KEY (thread_id, user_id),
  CONSTRAINT fk_thread_members_thread FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
  CONSTRAINT fk_thread_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(128) PRIMARY KEY,
  thread_id VARCHAR(128) NOT NULL,
  sender_id VARCHAR(64),
  body TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_messages_thread FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_messages_thread_created (thread_id, created_at DESC)
);
