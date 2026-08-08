import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { BasicProfile, ClubState, Need } from './types';
import { readClubState, writeClubState } from './storage';

export interface ClubContextValue {
  state: ClubState;
  toggleLightAnswer(question: number, answer: string): void;
  saveQaAnswer(key: string, value: string): void;
  saveBasicProfile(profile: BasicProfile): void;
  setOnboardingStep(step: number): void;
  completeOnboarding(): void;
  resetOnboarding(): void;
  publishNeed(title: string, tags: string[]): Need;
  toggleNeedSaved(id: string): void;
  toggleNeedResonance(id: string): void;
}
const ClubContext = createContext<ClubContextValue | null>(null);
export function ClubProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClubState>(() => {
    const saved = readClubState();
    return typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom') ? { ...saved, onboardingComplete: true } : saved;
  });
  useEffect(() => writeClubState(state), [state]);
  const value = useMemo<ClubContextValue>(() => ({
    state,
    toggleLightAnswer(question, answer) { setState(current => ({ ...current, lightAnswers: current.lightAnswers.map((items, index) => index === question ? (items.includes(answer) ? items.filter(item => item !== answer) : [...items, answer]) : items) })); },
    saveQaAnswer(key, answer) { setState(current => ({ ...current, qaAnswers: { ...current.qaAnswers, [key]: answer } })); },
    saveBasicProfile(profile) { setState(current => ({ ...current, profile })); },
    setOnboardingStep(step) { setState(current => ({ ...current, onboardingStep: step })); },
    completeOnboarding() { setState(current => ({ ...current, onboardingComplete: true, onboardingStep: 3 })); },
    resetOnboarding() { setState(current => ({ ...current, onboardingComplete: false, onboardingStep: 0 })); },
    publishNeed(title, tags) { const need: Need = { id: `mine-${Date.now()}`, author: `${state.profile.nickname} · 刚刚`, subtitle: '我发布的需求', tags, title, copy: '等待同频的人回应，也可以继续在评论区补充。', image: '/assets/coffee.jpg', resonance: 0, comments: 0, response: '还没有活动回应', similar: true }; setState(current => ({ ...current, publishedNeeds: [need, ...current.publishedNeeds] })); return need; },
    toggleNeedSaved(id) { setState(current => ({ ...current, savedNeedIds: current.savedNeedIds.includes(id) ? current.savedNeedIds.filter(item => item !== id) : [...current.savedNeedIds, id] })); },
    toggleNeedResonance(id) { setState(current => ({ ...current, resonatedNeedIds: current.resonatedNeedIds.includes(id) ? current.resonatedNeedIds.filter(item => item !== id) : [...current.resonatedNeedIds, id] })); },
  }), [state]);
  return <ClubContext.Provider value={value}>{children}</ClubContext.Provider>;
}
export function useClub() { const value = useContext(ClubContext); if (!value) throw new Error('useClub must be used inside ClubProvider'); return value; }
