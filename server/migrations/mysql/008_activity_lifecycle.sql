ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS lifecycle ENUM('pre','formal','archived') NOT NULL DEFAULT 'formal' AFTER note;

UPDATE activities
   SET lifecycle='formal'
 WHERE lifecycle IS NULL;

ALTER TABLE activity_members
  MODIFY COLUMN status ENUM('interested','joined') NOT NULL DEFAULT 'joined';
