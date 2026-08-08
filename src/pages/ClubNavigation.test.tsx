import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { BottomNav } from '../components/BottomNav';
import { ClubProvider } from '../club/ClubContext';
import { ActivitiesHomePage } from './ActivitiesHomePage';

it('uses four club tabs plus central publish and shows portrait recommendations', () => {
  render(
    <>
      <BottomNav activeTab="activities" onChange={vi.fn()} onPublish={vi.fn()} />
      <ClubProvider>
        <ActivitiesHomePage onExplore={vi.fn()} onNeeds={vi.fn()} />
      </ClubProvider>
    </>,
  );

  for (const label of ['活动', '发现', '需求', '我的']) {
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
  }
  expect(screen.getByRole('button', { name: '发布' })).toBeInTheDocument();
  expect(screen.getByText('给你的见面')).toBeInTheDocument();
  expect(screen.getByText('你更适合，慢一点认识的场景')).toBeInTheDocument();
});
