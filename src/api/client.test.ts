import { beforeEach, expect, it, vi } from 'vitest';
import { api, AUTH_TOKEN_KEY } from './client';

beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
it('adds the bearer token and unwraps data', async () => {
  localStorage.setItem(AUTH_TOKEN_KEY, 'token-1');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { user: { id: 'me', name: '小恰' } } }), { status: 200, headers: { 'content-type': 'application/json' } })));
  await api.me();
  expect(fetch).toHaveBeenCalledWith('/api/me', expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token-1' }) }));
});
