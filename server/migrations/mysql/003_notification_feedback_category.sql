-- Add activity-feedback notification category for post-event reminders.
ALTER TABLE notifications
  MODIFY COLUMN category ENUM('announcement','system','like','comment','feedback') NOT NULL;
