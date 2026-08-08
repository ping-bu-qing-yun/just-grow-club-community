import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { clubActivities } from '../club/seed';
import { ClubActivityDetailPage } from './ClubActivityDetailPage';

it('lets users tap consider and dislike feedback actions', async () => {
  const user = userEvent.setup();
  const onNotice = vi.fn();

  render(
    <ClubActivityDetailPage
      activity={clubActivities[0]}
      onBack={vi.fn()}
      onNotice={onNotice}
    />,
  );

  const consider = screen.getByRole('button', { name: '考虑' });
  const dislike = screen.getByRole('button', { name: '不喜欢' });

  expect(consider).toBeEnabled();
  expect(dislike).toBeEnabled();

  await user.click(consider);
  expect(onNotice).toHaveBeenCalledWith('已记下你的考虑，稍后可在消息里提醒你');

  await user.click(dislike);
  expect(onNotice).toHaveBeenCalledWith('已收到反馈，会少推相似活动');
});
