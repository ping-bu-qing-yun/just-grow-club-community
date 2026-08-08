# Qiahao Club Content Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the four self-discovery modules and the complete Activities, Explore, Needs, and Profile content from the reference HTML into the existing mobile React app.

**Architecture:** Keep `QiahaoContext` responsible for authenticated backend activity data. Add a focused `ClubContext` for versioned local onboarding, portrait, needs, and life-feed state; route all new screens through a four-tab app shell with explicit subview state.

**Tech Stack:** React 19, TypeScript, Lucide React, localStorage, Vitest, Testing Library, Playwright

---

### Task 1: Club Domain State

**Files:**
- Create: `src/club/types.ts`
- Create: `src/club/seed.ts`
- Create: `src/club/storage.ts`
- Create: `src/club/ClubContext.tsx`
- Test: `src/club/ClubContext.test.tsx`

- [ ] Write a failing test that selects one answer for each light question, saves profile fields, completes onboarding, publishes a need, and restores all data after remount.
- [ ] Run `npm test -- src/club/ClubContext.test.tsx --run`; expect missing-module failure.
- [ ] Define `ClubState`, `Need`, `LifePost`, `Portrait`, `OnboardingStep`, and a `ClubContextValue` with `toggleLightAnswer`, `saveQaAnswer`, `saveBasicProfile`, `completeOnboarding`, `publishNeed`, `toggleNeedSaved`, and `toggleNeedResonance`.
- [ ] Seed the reference HTML’s question sets, portrait labels, twelve needs, two life posts, and featured club activities in focused arrays.
- [ ] Implement safe versioned persistence under `qiahao-club-state-v1`; invalid JSON restores defaults.
- [ ] Run the focused test and commit with `feat: add club content state`.

### Task 2: Four-Step Self-Discovery Flow

**Files:**
- Create: `src/pages/onboarding/OnboardingFlow.tsx`
- Create: `src/pages/onboarding/LightQuestionsStep.tsx`
- Create: `src/pages/onboarding/QaCardsStep.tsx`
- Create: `src/pages/onboarding/BasicProfileStep.tsx`
- Create: `src/pages/onboarding/PortraitStep.tsx`
- Test: `src/pages/onboarding/OnboardingFlow.test.tsx`

- [ ] Write a failing user-flow test that answers three light questions, submits the three basic QA cards, fills nickname/occupation, generates the portrait, and calls `onComplete`.
- [ ] Run the focused test and confirm the missing flow.
- [ ] Implement a full-height flow with a four-step progress header, back/continue actions, inline validation, textarea answers, profile fields, and portrait summary.
- [ ] Use borderless sections, 18px page gutters, brand-red primary actions, green completion states, and orange caution labels.
- [ ] Run the test and commit with `feat: add self discovery flow`.

### Task 3: Four-Tab Navigation and Activities Home

**Files:**
- Modify: `src/components/BottomNav.tsx`
- Create: `src/pages/ActivitiesHomePage.tsx`
- Create: `src/components/ClubActivityCard.tsx`
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

- [ ] Write a failing test asserting the bottom navigation labels are 活动、发现、需求、我的 and that the Activities tab shows the portrait strip and “给你的见面”.
- [ ] Run the test and observe the old five-tab labels.
- [ ] Change `AppTab` to `activities | explore | needs | profile`, create a four-column navigation, and remove the centered publish treatment.
- [ ] Build the Activities home with greeting, portrait strip, a full-width image hero, mature/pre-activity cards, a need recommendation card, and a publish-activity shortcut.
- [ ] Route first-time users to onboarding and completed users to activities; preserve existing activity detail navigation.
- [ ] Run tests and commit with `feat: add club activities home`.

### Task 4: Complete Explore Catalog

**Files:**
- Create: `src/pages/ExplorePage.tsx`
- Modify: `src/domain/types.ts`
- Test: `src/pages/ExplorePage.test.tsx`

- [ ] Write a failing test covering 全部、低压力、深聊、散步、工作坊、预活动 filters and opening a catalog item.
- [ ] Run the focused test and confirm the page is missing.
- [ ] Map existing backend activities and the reference catalog into one `ClubActivity` presentation model with status, theme, image, date, place, people, fee, and description.
- [ ] Render borderless large-image cards with a horizontal filter strip and a clear empty state.
- [ ] Run the test and commit with `feat: add complete activity explore catalog`.

### Task 5: Needs and Life Content

**Files:**
- Create: `src/pages/NeedsPage.tsx`
- Create: `src/pages/NeedDetailPage.tsx`
- Create: `src/pages/CreateNeedPage.tsx`
- Create: `src/components/NeedCard.tsx`
- Create: `src/components/LifePostCard.tsx`
- Test: `src/pages/NeedsPage.test.tsx`

- [ ] Write failing tests for needs/life switching, similar/latest filters, opening a detail, toggling resonance and save, empty publish validation, and successful publish.
- [ ] Run the focused tests and confirm missing pages.
- [ ] Implement a hero, mode switch, large-image need cards, two-image life posts, detail response statistics, comments, and local actions.
- [ ] Implement the guided need composer with four suggestion chips, text, tags, optional image preview, and inline error.
- [ ] Run tests and commit with `feat: add needs and life community`.

### Task 6: Complete Profile Content

**Files:**
- Modify: `src/pages/ProfilePage.tsx`
- Create: `src/pages/ProfileEditorPage.tsx`
- Create: `src/pages/ProfileRecordsPage.tsx`
- Test: `src/pages/ProfilePage.test.tsx`

- [ ] Write failing tests for portrait progress, profile editor navigation, activity/need records, messages navigation, and logout.
- [ ] Run the focused test and observe missing content.
- [ ] Rebuild Profile with gradient cover, portrait identity, completion progress, two promotional panels, records, messages, services, editor, and logout.
- [ ] Reuse Qiahao activity/message state and Club profile/need state; do not duplicate persistence.
- [ ] Run tests and commit with `feat: complete club profile experience`.

### Task 7: Unified Styling and End-to-End Verification

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/styles/tokens.css`
- Modify: `e2e/qiahao.spec.ts`

- [ ] Add a failing Playwright journey for login, onboarding completion, all four tabs, need detail/publish, and profile records.
- [ ] Run `npm run e2e` and verify the old interface fails the new journey.
- [ ] Add responsive styles for onboarding, club hero, profile strip, large image cards, needs, life posts, portrait, and profile records; preserve the 460px desktop shell and safe-area bottom nav.
- [ ] Run `npm test -- --run`, `npm run build`, and `npm run e2e`; expect all commands to exit 0.
- [ ] Verify `http://127.0.0.1:5174/` and API health return 200, then commit with `test: verify complete club experience`.
