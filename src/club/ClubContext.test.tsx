import { act, render, screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { ClubProvider, useClub } from './ClubContext';
import { clubStorageKey } from './storage';

function Probe() {
  const club = useClub();
  return (
    <div>
      <output data-testid="done">{String(club.state.onboardingComplete)}</output>
      <output data-testid="nickname">{club.state.profile.nickname}</output>
      <output data-testid="needs">{club.state.publishedNeeds.length}</output>
      <output data-testid="life">{club.state.publishedLifePosts.length}</output>
      <output data-testid="joined">{club.state.joinedClubActivityIds.join(',')}</output>
      <output data-testid="saved">{club.state.savedClubActivityIds.join(',')}</output>
      <button onClick={() => club.toggleLightAnswer(0, '想认识靠谱的人')}>答题</button>
      <button
        onClick={() =>
          club.saveBasicProfile({ ...club.state.profile, nickname: '小满', occupation: '品牌策划' })
        }
      >
        资料
      </button>
      <button onClick={club.completeOnboarding}>完成</button>
      <button onClick={() => club.publishNeed('想认识能自然聊天的人', ['自然聊天'])}>发布需求</button>
      <button onClick={() => club.publishLife('周末想散步')}>发布生活</button>
      <button onClick={() => club.joinClubActivity('club-night')}>报名</button>
      <button onClick={() => club.toggleClubActivitySaved('club-night')}>收藏</button>
    </div>
  );
}

beforeEach(() => localStorage.clear());

it('persists onboarding profile and published needs', () => {
  const first = render(
    <ClubProvider>
      <Probe />
    </ClubProvider>,
  );
  act(() => screen.getByRole('button', { name: '答题' }).click());
  act(() => screen.getByRole('button', { name: '资料' }).click());
  act(() => screen.getByRole('button', { name: '完成' }).click());
  act(() => screen.getByRole('button', { name: '发布需求' }).click());
  expect(screen.getByTestId('done')).toHaveTextContent('true');
  first.unmount();
  render(
    <ClubProvider>
      <Probe />
    </ClubProvider>,
  );
  expect(screen.getByTestId('nickname')).toHaveTextContent('小满');
  expect(screen.getByTestId('needs')).toHaveTextContent('1');
});

it('stores club join/save and life posts under a scoped storage key', () => {
  render(
    <ClubProvider>
      <Probe />
    </ClubProvider>,
  );
  act(() => screen.getByRole('button', { name: '报名' }).click());
  act(() => screen.getByRole('button', { name: '收藏' }).click());
  act(() => screen.getByRole('button', { name: '发布生活' }).click());
  expect(screen.getByTestId('joined')).toHaveTextContent('club-night');
  expect(screen.getByTestId('saved')).toHaveTextContent('club-night');
  expect(screen.getByTestId('life')).toHaveTextContent('1');
  expect(localStorage.getItem(clubStorageKey('local-user'))).toContain('club-night');
  expect(localStorage.getItem('qiahao-club-state-v1')).toBeNull();
});
