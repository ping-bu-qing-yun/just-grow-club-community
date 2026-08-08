import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { ClubProvider } from '../club/ClubContext';
import { NeedsPage } from './NeedsPage';

it('switches modes without an in-page publish shortcut', async () => {
  const user = userEvent.setup();
  render(
    <ClubProvider>
      <NeedsPage onOpenNeed={vi.fn()} />
    </ClubProvider>,
  );

  expect(screen.getByText('大家正在寻找')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '发布需求' })).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '生活' }));
  expect(
    screen.getByText('最近想找杨浦附近的朋友，周末一起散步或喝杯咖啡。先轻松认识，不急着定义关系。'),
  ).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '需求' }));
  expect(screen.getByText('大家正在寻找')).toBeInTheDocument();
});
