import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import type { ApiComment, CommentPage } from '../api/types';
import type { CommentApi, CommentViewer } from '../hooks/useComments';
import { CommentSection } from './CommentSection';

const viewer: CommentViewer = { id: 'me', name: '小恰', avatar: '/assets/avatar-me.jpg', role: 'admin' };

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

function renderWithApi(apiClient: CommentApi, currentViewer: CommentViewer = viewer) {
  return render(<CommentSection contentType="need" contentId="d-test" apiClient={apiClient} localMode={false} viewer={currentViewer} />);
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
  const rows = within(screen.getByRole('list', { name: '评论列表' })).getAllByRole('listitem');
  expect(rows[0]).toHaveTextContent('刚刚发布');
  const ownRow = screen.getByText('我的评论').closest('li');
  if (!ownRow) throw new Error('own comment row missing');
  await user.click(within(ownRow).getByRole('button', { name: /删除小恰的评论/ }));
  await waitFor(() => expect(screen.queryByText('我的评论')).not.toBeInTheDocument());
  expect(apiClient.deleteComment).toHaveBeenCalledWith('own');
});

it('shows the delete action to an admin for another author comment', async () => {
  const apiClient: CommentApi = {
    listComments: vi.fn().mockResolvedValue({ comments: [comment('c1')], total: 1, nextCursor: null }),
    createComment: vi.fn(),
    deleteComment: vi.fn().mockResolvedValue(undefined),
  };
  const user = userEvent.setup();
  renderWithApi(apiClient, { id: 'admin-1', name: '小CC', role: 'admin' });
  await screen.findByText('c1');
  await user.click(screen.getByRole('button', { name: /删除作者u1的评论/ }));
  await waitFor(() => expect(screen.queryByText('c1')).not.toBeInTheDocument());
  expect(apiClient.deleteComment).toHaveBeenCalledWith('c1');
});

it('does not let a stale content response overwrite the next detail page', async () => {
  const pending: Record<string, Array<(page: CommentPage) => void>> = {};
  const apiClient: CommentApi = {
    listComments: vi.fn(({ contentId }) => new Promise<CommentPage>((resolve) => {
      (pending[contentId] ??= []).push(resolve);
    })),
    createComment: vi.fn(),
    deleteComment: vi.fn(),
  };
  const view = render(<CommentSection contentType="need" contentId="need-a" apiClient={apiClient} localMode={false} viewer={viewer} />);
  await waitFor(() => expect(pending['need-a']).toHaveLength(1));

  view.rerender(<CommentSection contentType="need" contentId="need-b" apiClient={apiClient} localMode={false} viewer={viewer} />);
  await waitFor(() => expect(pending['need-b']).toHaveLength(1));
  pending['need-b'].shift()?.({ comments: [comment('b1', '内容 B')], total: 1, nextCursor: null });
  expect(await screen.findByText('内容 B')).toBeInTheDocument();

  pending['need-a'].shift()?.({ comments: [comment('a1', '内容 A')], total: 1, nextCursor: null });
  await waitFor(() => expect(screen.queryByText('内容 A')).not.toBeInTheDocument());
  expect(screen.getByText('内容 B')).toBeInTheDocument();
});
