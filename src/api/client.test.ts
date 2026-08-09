import { beforeEach, expect, it, vi } from 'vitest';
import { api, AUTH_TOKEN_KEY } from './client';

beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
it('adds the bearer token and unwraps data', async () => {
  localStorage.setItem(AUTH_TOKEN_KEY, 'token-1');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { user: { id: 'me', name: '小恰' } } }), { status: 200, headers: { 'content-type': 'application/json' } })));
  await api.me();
  expect(fetch).toHaveBeenCalledWith('/api/me', expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token-1' }) }));
});

it('keeps comment pagination and mutations on the shared API contract', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ data: { comments: [], total: 6, nextCursor: 'next-1' } }), { status: 200, headers: { 'content-type': 'application/json' } }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ data: { comment: { id: 'c1' } } }), { status: 201, headers: { 'content-type': 'application/json' } }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);

  await api.listComments({ contentType: 'need', contentId: 'd1', limit: 5, cursor: 'cursor-1' });
  await api.createComment({ contentType: 'need', contentId: 'd1', body: '一条评论' });
  await api.deleteComment('comment/1');

  expect(fetchMock.mock.calls[0][0]).toBe('/api/comments?contentType=need&contentId=d1&limit=5&cursor=cursor-1');
  expect(fetchMock.mock.calls[1][0]).toBe('/api/comments');
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ contentType: 'need', contentId: 'd1', body: '一条评论' });
  expect(fetchMock.mock.calls[2][0]).toBe('/api/comments/comment%2F1');
});
