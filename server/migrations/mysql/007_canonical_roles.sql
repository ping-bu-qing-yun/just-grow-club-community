ALTER TABLE users
  MODIFY COLUMN role VARCHAR(16) NOT NULL DEFAULT 'member';

UPDATE users
   SET role=CASE LOWER(role)
     WHEN 'operator' THEN 'operator'
     WHEN 'admin' THEN 'operator'
     WHEN 'host' THEN 'host'
     WHEN 'member' THEN 'member'
     WHEN 'user' THEN 'member'
     ELSE 'member'
   END;

UPDATE users SET role='operator' WHERE id='me';

UPDATE users SET role='host' WHERE id='u2';

ALTER TABLE users
  MODIFY COLUMN role ENUM('member','host','operator') NOT NULL DEFAULT 'member';
