import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { clubActivities } from '../club/seed';
import { ClubActivityDetailPage } from './ClubActivityDetailPage';

beforeEach(() => {
  window.localStorage.clear();
});

function renderDetail(onNotice = vi.fn()) {
  render(
    <ClubActivityDetailPage
      activity={clubActivities[0]}
      onBack={vi.fn()}
      onNotice={onNotice}
    />,
  );
  return onNotice;
}

it('opens consider reasons and records the selected reason', async () => {
  const user = userEvent.setup();
  const onNotice = renderDetail();

  await user.click(screen.getByRole('button', { name: '考虑' }));
  const sheet = screen.getByRole('dialog', { name: '选择考虑原因' });
  expect(within(sheet).getByRole('heading', { name: '你为什么还想考虑？' })).toBeInTheDocument();

  await user.click(within(sheet).getByRole('button', { name: '时间不合适' }));
  expect(onNotice).toHaveBeenCalledWith('已记下：时间不合适');
  expect(screen.queryByRole('dialog', { name: '选择考虑原因' })).not.toBeInTheDocument();
});

it('asks for dislike reason only from the fourth 不考虑 tap', async () => {
  const user = userEvent.setup();
  const onNotice = renderDetail();

  await user.click(screen.getByRole('button', { name: '不考虑' }));
  expect(onNotice).toHaveBeenCalledWith('已记下不考虑（1/3），会少推相似活动');
  expect(screen.queryByRole('dialog', { name: '选择不考虑原因' })).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '不考虑' }));
  await user.click(screen.getByRole('button', { name: '不考虑' }));
  expect(onNotice).toHaveBeenLastCalledWith('已记下不考虑（3/3），会少推相似活动');

  await user.click(screen.getByRole('button', { name: '不考虑' }));
  const sheet = screen.getByRole('dialog', { name: '选择不考虑原因' });
  expect(within(sheet).getByRole('heading', { name: '你为什么不考虑？' })).toBeInTheDocument();

  await user.click(within(sheet).getByRole('button', { name: '地点有点远' }));
  expect(onNotice).toHaveBeenLastCalledWith('已记下不考虑：地点有点远');
});
