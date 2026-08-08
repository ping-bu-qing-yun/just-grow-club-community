import { expect, it } from 'vitest';
import { REQUIRED_MIGRATIONS } from '../db';
import { migrationStatementCounts } from '../migrations/service';

it('registers the complete MySQL migration chain and non-empty SQL files', async () => {
  const counts = await migrationStatementCounts();
  expect(REQUIRED_MIGRATIONS).toEqual([
    '001_initial.sql',
    '002_notifications.sql',
    '003_notification_feedback_category.sql',
    '004_roles_content.sql',
    '005_content_tags.sql',
    '006_comments.sql',
  ]);
  expect(counts).toHaveLength(REQUIRED_MIGRATIONS.length);
  expect(counts.every((item) => item.statements > 0)).toBe(true);
});
