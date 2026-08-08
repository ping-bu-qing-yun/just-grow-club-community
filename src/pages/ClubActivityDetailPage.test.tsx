import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { ClubProvider } from '../club/ClubContext';
import { clubActivities } from '../club/seed';
import { buildActivityShareLink } from '../lib/activityShare';
import { ClubActivityDetailPage } from './ClubActivityDetailPage';

beforeEach(() => {
  window.localStorage.clear();
});

function renderDetail(onNotice = vi.fn()) {
  render(
    <ClubProvider>
      <ClubActivityDetailPage
        activity={clubActivities[0]}
        onBack={vi.fn()}
        onNotice={onNotice}
      />
    </ClubProvider>,
  );
  return onNotice;
}

it('records consider without opening a reason sheet', async () => {
  const user = userEvent.setup();
  const onNotice = renderDetail();

  await user.click(screen.getByRole('button', { name: '考虑' }));
  expect(onNotice).toHaveBeenCalledWith('已记下你的考虑，稍后可在消息里提醒你');
  expect(screen.queryByRole('dialog', { name: '选择不考虑原因' })).not.toBeInTheDocument();
  expect(screen.queryByRole('dialog', { name: '选择考虑原因' })).not.toBeInTheDocument();
});

it('opens dislike reason sheet only on the fourth 不考虑 tap', async () => {
  const user = userEvent.setup();
  const onNotice = renderDetail();

  await user.click(screen.getByRole('button', { name: '不考虑' }));
  expect(onNotice).toHaveBeenCalledWith('已记下不考虑（1/3），会少推相似活动');
  expect(screen.queryByRole('dialog', { name: '选择不考虑原因' })).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '不考虑' }));
  await user.click(screen.getByRole('button', { name: '不考虑' }));
  expect(onNotice).toHaveBeenLastCalledWith('已记下不考虑（3/3），会少推相似活动');
  expect(screen.queryByRole('dialog', { name: '选择不考虑原因' })).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '不考虑' }));
  const sheet = screen.getByRole('dialog', { name: '选择不考虑原因' });
  expect(within(sheet).getByRole('heading', { name: '你为什么不考虑？' })).toBeInTheDocument();
  for (const reason of ['想看看来的人', '怕太像相亲', '时间不合适', '地点有点远', '人数有顾虑', '话题没击中']) {
    expect(within(sheet).getByRole('button', { name: reason })).toBeInTheDocument();
  }

  await user.click(within(sheet).getByRole('button', { name: '地点有点远' }));
  expect(onNotice).toHaveBeenLastCalledWith('已记下不考虑：地点有点远');
  expect(screen.queryByRole('dialog', { name: '选择不考虑原因' })).not.toBeInTheDocument();
});

it('shares the activity via clipboard when system share is unavailable', async () => {
  const user = userEvent.setup();
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  Object.defineProperty(navigator, 'share', {
    configurable: true,
    value: undefined,
  });
  const onNotice = renderDetail();

  await user.click(screen.getByRole('button', { name: /分享周五轻聊天晚餐局/ }));
  expect(writeText).toHaveBeenCalledWith(buildActivityShareLink('club-dinner'));
  expect(onNotice).toHaveBeenCalledWith('分享链接已复制');
});
