import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import App from '../App';

beforeEach(() => window.localStorage.clear());

it('opens an activity, joins it, and creates a message thread', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: '查看周六滨江轻徒步' }));
  expect(screen.getByRole('heading', { name: '周六滨江轻徒步' })).toBeInTheDocument();
  expect(screen.getByText('阿岚')).toBeInTheDocument();
  expect(screen.getByText(/徐汇滨江龙美术馆/)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '申请加入' }));
  const dialog = screen.getByRole('dialog', { name: '确认加入活动' });
  await user.click(within(dialog).getByRole('button', { name: '确认申请' }));

  expect(screen.getByRole('button', { name: '已申请' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: '消息' }));
  expect(screen.getByText('滨江轻徒步群聊')).toBeInTheDocument();
});

it('shows saved activities and an actionable empty state', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: '收藏周六滨江轻徒步' }));
  await user.click(screen.getByRole('button', { name: '心愿' }));
  expect(screen.getByRole('heading', { name: '我的心愿' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '周六滨江轻徒步' })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '取消收藏周六滨江轻徒步' }));
  expect(screen.getByText('还没有收藏活动')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '去发现' })).toBeInTheDocument();
});
