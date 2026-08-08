import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import type { ApiComment } from '../api/types';
import type { CommentApi } from '../hooks/useComments';
import { CommentSection } from './CommentSection';

const viewer = { id: 'me', name: '小恰', avatar: '/assets/avatar-me.jpg', role: 'admin' };

function comment(id: string, body = id, authorId = 'u1'): ApiComment {
  return {
    id,
    contentType: 'need',
    contentId: 'd-test',
    author: { id: authorId, name: authorId === 'me' ? '小恰' : `作者${authorId}`, avatar: '/assets/avatar-1.jpg' },
    body,
    createdAt: `2026-08-07T10:00:0${id.replace(/\D/g, '') || '0'}.000Z`,
  };
}

function renderWithApi(apiClient: CommentApi) {
  return render(<CommentSection contentType="need" contentId="d-test" apiClient={apiClient} localMode={false} viewer={viewer} />);
}

it('previews five comments, expands cursor pages, and collapses without refetching', async () => {
  const first = Array.from({ length: 5 }, (_, index) => comment(`c${index + 1}`));
  const sixth = comment('c6');
  const apiClient: CommentApi = {
    listComments: vi.fn()
      .mockResolvedValueOnce({ comments: first, total: 6, nextCursor: 'cursor-1' })
      .mockResolvedValueOnce({ comments: [sixth], total: 6, nextCursor: null }),
    createComment: vi.fn(),
    deleteComment: vi.fn(),
  };
  const user = userEvent.setup();
  renderWithApi(apiClient);

  expect(await screen.findByText('c1')).toBeInTheDocument();
  expect(screen.queryByText('c6')).not.toBeInTheDocument();
  await user.click(screen.getByText('展开全部评论'));
  expect(await screen.findByText('c6')).toBeInTheDocument();
  expect(apiClient.listComments).toHaveBeenCalledTimes(2);
  await user.click(screen.getByRole('button', { name: '收起评论' }));
  expect(screen.queryByText('c6')).not.toBeInTheDocument();
  expect(apiClient.listComments).toHaveBeenCalledTimes(2);
});

it('does not show a toggle for five or fewer comments', async () => {
  const apiClient: CommentApi = {
    listComments: vi.fn().mockResolvedValue({ comments: [comment('c1'), comment('c2'), comment('c3')], total: 3, nextCursor: null }),
    createComment: vi.fn(),
    deleteComment: vi.fn(),
  };
  renderWithApi(apiClient);
  await screen.findByText('c3');
  expect(screen.queryByRole('button', { name: /展开全部评论/ })).not.toBeInTheDocument();
});

it('adds a new comment and removes an author comment while keeping the count in sync', async () => {
  const own = comment('own', '我的评论', 'me');
  const created = comment('created', '刚刚发布', 'me');
  const apiClient: CommentApi = {
    listComments: vi.fn().mockResolvedValue({ comments: [own], total: 1, nextCursor: null }),
    createComment: vi.fn().mockResolvedValue({ comment: created }),
    deleteComment: vi.fn().mockResolvedValue(undefined),
  };
  const user = userEvent.setup();
  renderWithApi(apiClient);
  await screen.findByText('我的评论');
  await user.type(screen.getByLabelText('评论内容'), '新评论');
  await user.click(screen.getByRole('button', { name: '发布评论' }));
  expect(await screen.findByText('刚刚发布')).toBeInTheDocument();
  expect(screen.getByLabelText('共2条评论')).toBeInTheDocument();
  const ownRow = screen.getByText('我的评论').closest('li');
  if (!ownRow) throw new Error('own comment row missing');
  await user.click(within(ownRow).getByRole('button', { name: /删除小恰的评论/ }));
  await waitFor(() => expect(screen.queryByText('我的评论')).not.toBeInTheDocument());
  expect(apiClient.deleteComment).toHaveBeenCalledWith('own');
});
