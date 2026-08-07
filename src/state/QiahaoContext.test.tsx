import { act, render, screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { QiahaoProvider, useQiahao } from './QiahaoContext';

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
