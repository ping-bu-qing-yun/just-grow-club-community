import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { BottomNav } from '../components/BottomNav';
import { ClubProvider } from '../club/ClubContext';
import { ActivitiesHomePage } from './ActivitiesHomePage';
import { QiahaoProvider } from '../state/QiahaoContext';
import { NotificationsProvider } from '../notifications/NotificationContext';

it('uses four club tabs plus central publish and shows portrait recommendations', () => {
  render(
    <>
      <BottomNav activeTab="activities" onChange={vi.fn()} onPublish={vi.fn()} />
      <QiahaoProvider>
        <NotificationsProvider>
          <ClubProvider>
            <ActivitiesHomePage onNeeds={vi.fn()} onOpenActivity={vi.fn()} onOpenNotifications={vi.fn()} />
          </ClubProvider>
        </NotificationsProvider>
      </QiahaoProvider>
    </>,
  );

  for (const label of ['活动', '发现', '需求', '我的']) {
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
  }
  expect(screen.getByRole('button', { name: '发布' })).toBeInTheDocument();
  expect(screen.getByText('给你的见面')).toBeInTheDocument();
  expect(screen.getByText('你更适合，慢一点认识的场景')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /查看全部/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '发布活动' })).not.toBeInTheDocument();
});
