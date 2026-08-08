import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import App from '../App';

beforeEach(() => window.localStorage.clear());

it('validates required fields and publishes from the activities shortcut', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: '发布活动' }));
  expect(screen.getByRole('heading', { name: '发起一次恰好的见面' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '确认发布' }));
  expect(screen.getByText('请填写活动标题')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '徒步' }));
  await user.type(screen.getByLabelText('活动标题'), '周日城市散步');
  await user.type(screen.getByLabelText('活动介绍'), '从梧桐区走到苏州河，边走边认识城市。');
  await user.type(screen.getByLabelText('日期'), '周日 · 8月9日');
  await user.type(screen.getByLabelText('时间'), '16:00');
  await user.type(screen.getByLabelText('集合地点'), '衡山路地铁站');
  await user.click(screen.getByRole('button', { name: '确认发布' }));

  expect(screen.getByRole('status')).toHaveTextContent('活动已发布');
  expect(screen.getByRole('heading', { name: '恰好' })).toBeInTheDocument();
});

it('shows the club identity, trust state, and activity statistics', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: '我的' }));

  expect(screen.getByRole('heading', { name: '小恰' })).toBeInTheDocument();
  expect(screen.getByText('已实名')).toBeInTheDocument();
  expect(screen.getByText('参与活动')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /活动收藏/ })).toBeInTheDocument();
});
