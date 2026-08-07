import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { QiahaoProvider } from '../state/QiahaoContext';
import { DiscoverPage } from './DiscoverPage';

beforeEach(() => window.localStorage.clear());

function renderPage(onOpenActivity = vi.fn()) {
  render(
    <QiahaoProvider>
      <DiscoverPage onOpenActivity={onOpenActivity} />
    </QiahaoProvider>,
  );
  return onOpenActivity;
}

it('shows the discovery story and activity cards', () => {
  renderPage();

  expect(screen.getByText('恰好，一起出发')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '离你正好' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '周六滨江轻徒步' })).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /收藏/ }).length).toBeGreaterThan(0);
});

it('filters activities by category', async () => {
  const user = userEvent.setup();
  renderPage();

  await user.click(screen.getByRole('button', { name: '看展' }));

  expect(screen.getByRole('heading', { name: '西岸摄影展同行' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: '周六滨江轻徒步' })).not.toBeInTheDocument();
});

it('saves a card without opening it, then opens from its content', async () => {
  const user = userEvent.setup();
  const onOpenActivity = renderPage();

  await user.click(screen.getByRole('button', { name: '收藏周六滨江轻徒步' }));
  expect(screen.getByRole('button', { name: '取消收藏周六滨江轻徒步' })).toBeInTheDocument();
  expect(onOpenActivity).not.toHaveBeenCalled();

  await user.click(screen.getByRole('heading', { name: '周六滨江轻徒步' }));
  expect(onOpenActivity).toHaveBeenCalledWith('walk-001');
});
