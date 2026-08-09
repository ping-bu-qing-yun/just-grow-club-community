import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { BasicProfile, ClubState, LifePost, Need } from './types';
import { defaultClubState, readClubState, writeClubState } from './storage';
import { QiahaoContext } from '../state/qiahao-context';

export interface ClubContextValue {
  state: ClubState;
  toggleLightAnswer(question: number, answer: string): void;
  saveQaAnswer(key: string, value: string): void;
  saveBasicProfile(profile: BasicProfile): void;
  setOnboardingStep(step: number): void;
  completeOnboarding(): void;
  resetOnboarding(): void;
  publishNeed(title: string, tags: string[]): Need;
  publishLife(text: string): LifePost;
  toggleNeedSaved(id: string): void;
  toggleNeedResonance(id: string): void;
  toggleLifeAuthorFollow(author: string): void;
  toggleLifePostResonance(id: string): void;
  isLifeAuthorFollowed(author: string): boolean;
  isLifePostResonated(id: string): boolean;
  toggleClubActivitySaved(id: string): void;
  joinClubActivity(id: string): void;
  cancelClubActivity(id: string, reason: string): void;
  dislikeClubActivity(id: string): void;
  saveClubActivityConsideration(id: string, reasons: string[]): void;
  markReservationCommented(id: string): void;
  isClubActivitySaved(id: string): boolean;
  isClubActivityJoined(id: string): boolean;
}

const ClubContext = createContext<ClubContextValue | null>(null);

function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function useOptionalQiahaoUserId(): string {
  const qiahao = useContext(QiahaoContext);
  if (!qiahao) return 'local-user';
  if (qiahao.user?.id) return qiahao.user.id;
  if (qiahao.status === 'authenticated') return 'local-user';
  return 'anonymous';
}

export function ClubProvider({ children }: { children: ReactNode }) {
  const userId = useOptionalQiahaoUserId();
  const storageUserId = userId === 'anonymous' ? 'local-user' : userId;
  const jsdomComplete =
    typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom');

  const [state, setState] = useState<ClubState>(() => {
    const saved = readClubState(storageUserId);
    return jsdomComplete ? { ...saved, onboardingComplete: true } : saved;
  });
  const [activeUserId, setActiveUserId] = useState(storageUserId);

  // 切换登录用户时加载对应用户的 Club 状态
  useEffect(() => {
    if (storageUserId === activeUserId) return;
    const next = readClubState(storageUserId);
    setState(jsdomComplete ? { ...next, onboardingComplete: true } : next);
    setActiveUserId(storageUserId);
  }, [storageUserId, activeUserId, jsdomComplete]);

  useEffect(() => {
    writeClubState(state, storageUserId);
  }, [state, storageUserId]);

  const value = useMemo<ClubContextValue>(
    () => ({
      state,
      toggleLightAnswer(question, answer) {
        setState((current) => ({
          ...current,
          lightAnswers: current.lightAnswers.map((items, index) =>
            index === question
              ? items.includes(answer)
                ? items.filter((item) => item !== answer)
                : [...items, answer]
              : items,
          ),
        }));
      },
      saveQaAnswer(key, answer) {
        setState((current) => ({ ...current, qaAnswers: { ...current.qaAnswers, [key]: answer } }));
      },
      saveBasicProfile(profile) {
        setState((current) => ({ ...current, profile }));
      },
      setOnboardingStep(step) {
        setState((current) => ({ ...current, onboardingStep: step }));
      },
      completeOnboarding() {
        setState((current) => ({ ...current, onboardingComplete: true, onboardingStep: 3 }));
      },
      resetOnboarding() {
        setState((current) => ({ ...current, onboardingComplete: false, onboardingStep: 0 }));
      },
      publishNeed(title, tags) {
        const need: Need = {
          id: `mine-${Date.now()}`,
          author: `${state.profile.nickname} · 刚刚`,
          subtitle: '我发布的需求',
          tags,
          title,
          copy: '等待同频的人回应，也可以继续在评论区补充。',
          image: '/assets/coffee.jpg',
          resonance: 0,
          comments: 0,
          response: '还没有活动回应',
          similar: true,
        };
        setState((current) => ({ ...current, publishedNeeds: [need, ...current.publishedNeeds] }));
        return need;
      },
      publishLife(text) {
        const post: LifePost = {
          id: `life-mine-${Date.now()}`,
          author: state.profile.nickname || '我',
          meta: '刚刚 · 附近',
          kind: '生活分享',
          text: text.trim(),
          images: ['/assets/coffee.jpg'],
          tag: '#刚刚发布',
          comments: 0,
          resonance: 0,
        };
        setState((current) => ({
          ...current,
          publishedLifePosts: [post, ...current.publishedLifePosts],
        }));
        return post;
      },
      toggleNeedSaved(id) {
        setState((current) => ({ ...current, savedNeedIds: toggleId(current.savedNeedIds, id) }));
      },
      toggleNeedResonance(id) {
        setState((current) => ({
          ...current,
          resonatedNeedIds: toggleId(current.resonatedNeedIds, id),
        }));
      },
      toggleLifeAuthorFollow(author) {
        setState((current) => ({
          ...current,
          followedLifeAuthorIds: toggleId(current.followedLifeAuthorIds, author),
        }));
      },
      toggleLifePostResonance(id) {
        setState((current) => ({
          ...current,
          resonatedLifePostIds: toggleId(current.resonatedLifePostIds, id),
        }));
      },
      isLifeAuthorFollowed(author) {
        return state.followedLifeAuthorIds.includes(author);
      },
      isLifePostResonated(id) {
        return state.resonatedLifePostIds.includes(id);
      },
      toggleClubActivitySaved(id) {
        setState((current) => ({
          ...current,
          savedClubActivityIds: toggleId(current.savedClubActivityIds, id),
        }));
      },
      joinClubActivity(id) {
        setState((current) =>
          current.joinedClubActivityIds.includes(id)
            ? current
            : {
                ...current,
                joinedClubActivityIds: [...current.joinedClubActivityIds, id],
                cancelledClubActivityReasons: Object.fromEntries(
                  Object.entries(current.cancelledClubActivityReasons).filter(([activityId]) => activityId !== id),
                ),
              },
        );
      },
      cancelClubActivity(id, reason) {
        setState((current) => ({
          ...current,
          joinedClubActivityIds: current.joinedClubActivityIds.filter((item) => item !== id),
          cancelledClubActivityReasons: { ...current.cancelledClubActivityReasons, [id]: reason },
        }));
      },
      dislikeClubActivity(id) {
        setState((current) => ({
          ...current,
          dislikedClubActivityIds: current.dislikedClubActivityIds.includes(id)
            ? current.dislikedClubActivityIds
            : [...current.dislikedClubActivityIds, id],
          consideredClubActivityReasons: Object.fromEntries(
            Object.entries(current.consideredClubActivityReasons).filter(([activityId]) => activityId !== id),
          ),
        }));
      },
      saveClubActivityConsideration(id, reasons) {
        setState((current) => ({
          ...current,
          dislikedClubActivityIds: current.dislikedClubActivityIds.filter((activityId) => activityId !== id),
          consideredClubActivityReasons: {
            ...current.consideredClubActivityReasons,
            [id]: reasons,
          },
        }));
      },
      markReservationCommented(id) {
        setState((current) =>
          current.reservationCommentedActivityIds.includes(id)
            ? current
            : { ...current, reservationCommentedActivityIds: [...current.reservationCommentedActivityIds, id] },
        );
      },
      isClubActivitySaved(id) {
        return state.savedClubActivityIds.includes(id);
      },
      isClubActivityJoined(id) {
        return state.joinedClubActivityIds.includes(id);
      },
    }),
    [state],
  );

  return <ClubContext.Provider value={value}>{children}</ClubContext.Provider>;
}

export function useClub(): ClubContextValue {
  const value = useContext(ClubContext);
  if (!value) throw new Error('useClub must be used inside ClubProvider');
  return value;
}

export { defaultClubState };
