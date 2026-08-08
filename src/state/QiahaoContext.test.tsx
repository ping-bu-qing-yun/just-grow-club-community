import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { QiahaoProvider, useQiahao } from './QiahaoContext';
import type { QiahaoApi } from '../api/types';

function StoreProbe() {
  const store = useQiahao();

  return (
    <div>
      <output data-testid="saved">{[...store.savedIds].join(',')}</output>
      <output data-testid="joined">{[...store.joinedIds].join(',')}</output>
      <output data-testid="first-title">{store.activities[0]?.title}</output>
      <output data-testid="messages">{store.messages.map((message) => message.title).join(',')}</output>
      <button type="button" onClick={() => store.toggleSaved('walk-001')}>收藏</button>
      <button type="button" onClick={() => store.joinActivity('walk-001')}>报名</button>
      <button
        type="button"
        onClick={() => store.createActivity({
          title: '周日城市散步',
          category: '徒步',
          description: '从梧桐区走到苏州河，边走边认识城市。',
          dateLabel: '周日 · 8月9日',
          time: '16:00',
          location: '衡山路地铁站',
          capacity: 6,
          price: 0,
        })}
      >
        发布
      </button>
    </div>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

it('toggles a saved activity', () => {
  render(<QiahaoProvider><StoreProbe /></QiahaoProvider>);

  act(() => screen.getByRole('button', { name: '收藏' }).click());

  expect(screen.getByTestId('saved')).toHaveTextContent('walk-001');
});

it('joins an activity and creates its conversation', () => {
  render(<QiahaoProvider><StoreProbe /></QiahaoProvider>);

  act(() => screen.getByRole('button', { name: '报名' }).click());

  expect(screen.getByTestId('joined')).toHaveTextContent('walk-001');
  expect(screen.getByTestId('messages')).toHaveTextContent('滨江轻徒步群聊');
});

it('creates an activity at the top and restores persisted state', () => {
  const firstMount = render(<QiahaoProvider><StoreProbe /></QiahaoProvider>);
  act(() => screen.getByRole('button', { name: '收藏' }).click());
  act(() => screen.getByRole('button', { name: '发布' }).click());
  expect(screen.getByTestId('first-title')).toHaveTextContent('周日城市散步');

  firstMount.unmount();
  render(<QiahaoProvider><StoreProbe /></QiahaoProvider>);

  expect(screen.getByTestId('saved')).toHaveTextContent('walk-001');
  expect(screen.getByTestId('first-title')).toHaveTextContent('周日城市散步');
});

it('hydrates an existing session before loading remote data', async () => {
  const remoteApi: QiahaoApi = {
    login: vi.fn(), logout: vi.fn(),
    me: vi.fn().mockResolvedValue({ user: { id: 'me', phone: '13800000000', name: '小恰', avatar: '/avatar.jpg', bio: '', verified: true, role: 'user' } }),
    activities: vi.fn().mockResolvedValue({ activities: [] }),
    createActivity: vi.fn(),
    needs: vi.fn().mockResolvedValue({ needs: [] }),
    createNeed: vi.fn(),
    updateNeed: vi.fn(),
    archiveNeed: vi.fn(),
    lifePosts: vi.fn().mockResolvedValue({ lifePosts: [] }),
    createLifePost: vi.fn(),
    updateLifePost: vi.fn(),
    archiveLifePost: vi.fn(),
    adminContent: vi.fn().mockResolvedValue({ items: [] }),
    updateContentStatus: vi.fn(),
    adminTags: vi.fn().mockResolvedValue({ tags: [] }),
    createTag: vi.fn(),
    updateTag: vi.fn(),
    favorite: vi.fn(),
    join: vi.fn(),
    threads: vi.fn().mockResolvedValue({ threads: [] }),
  };
  localStorage.setItem('qiahao-auth-token', 'existing-token');
  function Probe() { const store = useQiahao(); return <output data-testid="remote-status">{store.status}</output>; }
  render(<QiahaoProvider apiClient={remoteApi}><Probe /></QiahaoProvider>);
  expect(await screen.findByTestId('remote-status')).toHaveTextContent('authenticated');
  expect(remoteApi.me).toHaveBeenCalled();
  await waitFor(() => expect(remoteApi.activities).toHaveBeenCalled());
});
