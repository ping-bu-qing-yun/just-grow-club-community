import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import App from './App';

beforeEach(() => {
  localStorage.clear();
});

it('renders four primary tabs and a central publish entry', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: '恰好' })).toBeInTheDocument();
  for (const label of ['活动', '发现', '需求', '我的']) {
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
  }
  expect(screen.getByRole('button', { name: '发布' })).toBeInTheDocument();
});

it('opens role-aware publish choices from the central plus button', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: '发布' }));
  const sheet = screen.getByRole('dialog', { name: '选择发布类型' });
  expect(within(sheet).getByRole('button', { name: /活动/ })).toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: /需求/ })).toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: /生活/ })).toBeInTheDocument();

  await user.click(within(sheet).getByRole('button', { name: /活动/ }));
  expect(screen.getByRole('heading', { name: '发起一次恰好的见面' })).toBeInTheDocument();
});

it('opens notification details and routes to the referenced activity', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /通知，有3条未读/ }));
  expect(screen.getByRole('heading', { name: '通知' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '活动' })).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /本周活动上新/ }));
  expect(screen.getByRole('heading', { name: '本周活动上新' })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '查看活动' }));
  expect(screen.getByRole('heading', { name: '周五轻聊天晚餐局' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '报名' })).toBeInTheDocument();
});
