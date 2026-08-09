import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { BasicProfile, ClubState } from './types';
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
}

const ClubContext = createContext<ClubContextValue | null>(null);

function useOptionalQiahaoUserId(): string {
  const qiahao = useContext(QiahaoContext);
  if (!qiahao) return 'local-user';
  if (qiahao.user?.id) return qiahao.user.id;
  if (qiahao.status === 'authenticated') return 'local-user';
  return 'anonymous';
}

export function ClubProvider({ children }: { children: ReactNode }) {
  const qiahao = useContext(QiahaoContext);
  const userId = useOptionalQiahaoUserId();
  const storageUserId = userId === 'anonymous' ? 'local-user' : userId;
  const jsdomComplete =
    typeof navigator !== 'undefined'
    && (navigator.userAgent.includes('jsdom') || import.meta.env.MODE === 'preview');

  const [state, setState] = useState<ClubState>(() => {
    if (!jsdomComplete) return qiahao?.profileRecord ?? defaultClubState;
    const saved = readClubState(storageUserId);
    return { ...saved, onboardingComplete: true };
  });
  const [activeUserId, setActiveUserId] = useState(storageUserId);

  // 切换登录用户时加载对应用户的 Club 状态
  useEffect(() => {
    if (storageUserId === activeUserId) return;
    const next = jsdomComplete ? readClubState(storageUserId) : qiahao?.profileRecord ?? defaultClubState;
    setState(jsdomComplete ? { ...next, onboardingComplete: true } : next);
    setActiveUserId(storageUserId);
  }, [storageUserId, activeUserId, jsdomComplete, qiahao?.profileRecord]);

  useEffect(() => {
    if (jsdomComplete) writeClubState(state, storageUserId);
  }, [jsdomComplete, state, storageUserId]);

  useEffect(() => {
    if (!qiahao?.profileRecord) return;
    setState((current) => JSON.stringify(current) === JSON.stringify(qiahao.profileRecord) ? current : qiahao.profileRecord!);
  }, [qiahao?.profileRecord]);

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
        void qiahao?.deleteOnboardingProgress();
      },
    }),
    [qiahao, state],
  );

  return <ClubContext.Provider value={value}>{children}</ClubContext.Provider>;
}

export function useClub(): ClubContextValue {
  const value = useContext(ClubContext);
  if (!value) throw new Error('useClub must be used inside ClubProvider');
  return value;
}

export { defaultClubState };
