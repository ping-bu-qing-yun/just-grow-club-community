import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { QiahaoProvider } from '../state/QiahaoContext';
import { NotificationCenterPage } from '../pages/NotificationCenterPage';
import { NotificationsProvider } from './NotificationContext';

function renderCenter() {
  return render(
    <QiahaoProvider>
      <NotificationsProvider>
        <NotificationCenterPage onBack={vi.fn()} onOpen={vi.fn()} />
      </NotificationsProvider>
    </QiahaoProvider>,
  );
}

beforeEach(() => window.localStorage.clear());

it('filters notifications including feedback and clears only read entries', async () => {
  const user = userEvent.setup();
  renderCenter();

  expect(screen.getByText('本周活动上新')).toBeInTheDocument();
  expect(screen.getByText('填写活动反馈')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '反馈' }));
  expect(screen.getByText('填写活动反馈')).toBeInTheDocument();
  expect(screen.queryByText('本周活动上新')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '评论' }));
  expect(screen.getByText('收到一条评论回复')).toBeInTheDocument();
  expect(screen.queryByText('填写活动反馈')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '全部' }));
  await user.click(screen.getByRole('button', { name: '清空已读' }));
  expect(screen.queryByText('收到一条评论回复')).not.toBeInTheDocument();
  expect(screen.getByText('本周活动上新')).toBeInTheDocument();
  expect(screen.getByText('填写活动反馈')).toBeInTheDocument();
});
