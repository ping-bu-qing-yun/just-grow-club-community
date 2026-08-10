import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import App from './App';
import { resolveRootDestination } from './app/AppRouter';
import { Sheet } from './components/Sheet';
import { activityListQuerySchema, contentListQuerySchema, createActivityInputSchema, cursorPageQuerySchema, loginRequestSchema, participationStatusSchema } from './contracts/api';
import { canPublishActivity, normalizeUserRole } from './domain/roles';
import { serializeOnboardingAnswers } from './state/QiahaoContext';

function SheetHarness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>打开</button>
      {open ? <Sheet label="测试弹层" onClose={() => setOpen(false)}><button type="button">确认</button></Sheet> : null}
    </div>
  );
}

describe('shared product contracts', () => {
  it('normalizes legacy roles and limits activity publishing to operators', () => {
    expect(normalizeUserRole('admin')).toBe('operator');
    expect(normalizeUserRole('user')).toBe('member');
    expect(canPublishActivity({ role: 'operator' })).toBe(true);
    expect(canPublishActivity({ role: 'host' })).toBe(false);
  });

  it('validates credentials, pagination and activity fields', () => {
    const activity = { title: '周末散步', category: '徒步', description: '慢慢走一圈', dateLabel: '周六 · 8月15日', time: '15:30', location: '徐汇滨江', capacity: 6, price: 0 };
    expect(createActivityInputSchema.safeParse(activity).success).toBe(true);
    expect(createActivityInputSchema.safeParse({ ...activity, time: '25:61', capacity: 1 }).success).toBe(false);
    expect(cursorPageQuerySchema.parse({ limit: '12' }).limit).toBe(12);
    expect(activityListQuerySchema.parse({ category: 'hike', theme: 'walk', q: '滨江', limit: '12' })).toMatchObject({ category: 'hike', theme: 'walk', q: '滨江', limit: 12 });
    expect(contentListQuerySchema.safeParse({ type: 'activity' }).success).toBe(false);
    expect(loginRequestSchema.safeParse({ phone: '13800000000', password: 'qiahao123' }).success).toBe(true);
    expect(participationStatusSchema.options).toEqual(['interested', 'joined', 'cancelled', 'waitlisted']);
    expect(participationStatusSchema.safeParse('cancelled').success).toBe(true);
  });

  it('serializes legacy QA state with the configured API question keys', () => {
    const answers = serializeOnboardingAnswers(
      {
        lightAnswers: [['想认识靠谱的人'], ['轻松散步'], ['怕尴尬']],
        qaAnswers: { 'basic:0': '  做自己很舒服  ', 'extra:0': '自然表达在意' },
      },
      [
        { key: 'light:intent', sectionKey: 'light' },
        { key: 'light:scene', sectionKey: 'light' },
        { key: 'light:barrier', sectionKey: 'light' },
        { key: 'qa:basic:0', sectionKey: 'qa-basic' },
        { key: 'qa:extra:0', sectionKey: 'qa-extra' },
      ],
    );

    expect(answers).toEqual({
      'light:intent': ['想认识靠谱的人'],
      'light:scene': ['轻松散步'],
      'light:barrier': ['怕尴尬'],
      'qa:basic:0': ['做自己很舒服'],
      'qa:extra:0': ['自然表达在意'],
    });
  });
});

describe('URL router', () => {
  it('keeps legacy activity links compatible and renders the routed preview', async () => {
    expect(resolveRootDestination('?activity=club-dinner')).toBe('/activities/club-dinner');
    window.history.replaceState({}, '', '/');
    render(<App />);
    expect(await screen.findByRole('heading', { name: '恰好' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/activities');
  });
});

describe('Sheet', () => {
  it('closes with Escape and restores focus', async () => {
    const user = userEvent.setup();
    render(<SheetHarness />);
    const trigger = screen.getByRole('button', { name: '打开' });
    await user.click(trigger);
    await waitFor(() => expect(screen.getByRole('button', { name: '关闭' })).toHaveFocus());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('uses pointer gestures to dismiss decisively', async () => {
    render(<SheetHarness />);
    fireEvent.click(screen.getByRole('button', { name: '打开' }));
    const handle = document.querySelector('.sheet-handle-area') as HTMLElement;
    fireEvent.pointerDown(handle, { pointerId: 7, button: 0, clientY: 100 });
    fireEvent.pointerMove(handle, { pointerId: 7, clientY: 260 });
    fireEvent.pointerUp(handle, { pointerId: 7, clientY: 300 });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
