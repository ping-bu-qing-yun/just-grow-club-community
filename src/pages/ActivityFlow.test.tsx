import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import App from '../App';

beforeEach(() => window.localStorage.clear());

it('navigates all four club tabs and opens a need detail', async () => {
  const user = userEvent.setup();
  render(<App />);

  expect(screen.getByRole('heading', { name: '恰好' })).toBeInTheDocument();
  for (const label of ['活动', '发现', '需求', '我的']) {
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
  }

  await user.click(screen.getByRole('button', { name: '发现' }));
  expect(screen.getByRole('heading', { name: '发现其他活动' })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '需求' }));
  await user.click(screen.getByRole('button', { name: '不想尴尬交换微信，但想认真认识人' }));
  expect(screen.getByRole('heading', { name: '不想尴尬交换微信，但想认真认识人' })).toBeInTheDocument();
  expect(screen.getByText('这张需求正在发生什么')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '我也有' }));
  expect(screen.getByRole('button', { name: '已共鸣' })).toBeInTheDocument();
});

it('opens profile records from the new profile hub', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: '我的' }));
  expect(screen.getByRole('heading', { name: '小恰' })).toBeInTheDocument();
  expect(screen.getByText('画像完善度')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /参加过活动/ }));
  expect(screen.getByRole('heading', { name: '参加过活动' })).toBeInTheDocument();
  expect(screen.getByText('这里还没有记录')).toBeInTheDocument();
});
