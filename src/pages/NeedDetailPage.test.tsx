import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { ClubProvider } from '../club/ClubContext';
import { seedNeeds } from '../club/seed';
import type { Need } from '../club/types';
import { NeedDetailPage } from './NeedDetailPage';

function renderDetail(need: Need, onOpenActivity = vi.fn()) {
  return render(
    <ClubProvider>
      <NeedDetailPage need={need} onBack={vi.fn()} onOpenActivity={onOpenActivity} />
    </ClubProvider>,
  );
}

const emptyNeed: Need = {
  id: 'mine-1',
  author: '我 · 刚刚',
  subtitle: '我发布的需求',
  tags: ['自然认识'],
  title: '想找能慢慢聊天的人',
  copy: '先认识，不急着定义关系。',
  image: '/assets/coffee.jpg',
  resonance: 0,
  comments: 0,
  response: '还没有活动回应',
};

it('shows responded style and opens the linked activity on 查看', async () => {
  const user = userEvent.setup();
  const onOpenActivity = vi.fn();
  const need = seedNeeds.find((item) => item.id === 'd1')!;

  renderDetail(need, onOpenActivity);

  expect(screen.getByText('有人接住')).toBeInTheDocument();
  expect(screen.getByText(/有活动回应了/)).toBeInTheDocument();
  expect(screen.getByLabelText('需求互动数据')).toHaveTextContent('1场回应');
  expect(screen.getByRole('button', { name: /展开更多评论/ })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '查看' }));

  expect(onOpenActivity).toHaveBeenCalledTimes(1);
  expect(onOpenActivity.mock.calls[0][0]).toMatchObject({
    id: 'club-dinner',
    title: '周五轻聊天晚餐局',
  });
});

it('shows grey empty states when resonance, comments and activity response are empty', () => {
  renderDetail(emptyNeed);

  expect(screen.getByText('还在等回应')).toBeInTheDocument();
  expect(screen.getByLabelText('需求互动数据')).toHaveTextContent('0人共鸣');
  expect(screen.getByLabelText('需求互动数据')).toHaveTextContent('0条评论');
  expect(screen.getByLabelText('需求互动数据')).toHaveTextContent('0场回应');

  expect(screen.getByText('还没有活动回应')).toBeInTheDocument();
  expect(screen.getByText('收藏这张需求，之后有合适的活动，我们会通知你')).toBeInTheDocument();
  expect(screen.getByText('还没有评论')).toBeInTheDocument();
  expect(screen.getByText('第一个说点什么吧')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '查看' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /展开更多评论/ })).not.toBeInTheDocument();
});

it('keeps comment empty state after resonating while stats update', async () => {
  const user = userEvent.setup();
  renderDetail(emptyNeed);

  await user.click(screen.getByRole('button', { name: '我也有' }));
  expect(screen.getByRole('button', { name: '已共鸣' })).toBeInTheDocument();
  expect(screen.getByLabelText('需求互动数据')).toHaveTextContent('1人共鸣');
  expect(screen.getByText('还没有评论')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /展开更多评论/ })).not.toBeInTheDocument();
});
