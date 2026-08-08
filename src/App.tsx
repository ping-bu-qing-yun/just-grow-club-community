import { useState } from 'react';
import { AppShell } from './components/AppShell';
import type { AppTab } from './components/BottomNav';
import type { Need } from './club/types';
import { ClubProvider, useClub } from './club/ClubContext';
import { QiahaoProvider, useQiahao } from './state/QiahaoContext';
import { LoginPage } from './pages/LoginPage';
import { OnboardingFlow } from './pages/onboarding/OnboardingFlow';
import { ActivitiesHomePage } from './pages/ActivitiesHomePage';
import { ExplorePage } from './pages/ExplorePage';
import { NeedsPage } from './pages/NeedsPage';
import { NeedDetailPage } from './pages/NeedDetailPage';
import { ProfilePage, type ProfileDestination } from './pages/ProfilePage';
import { ProfileEditorPage } from './pages/ProfileEditorPage';
import { ProfileRecordsPage } from './pages/ProfileRecordsPage';
import { CreateActivityPage } from './pages/CreateActivityPage';
import { MessagesPage } from './pages/MessagesPage';
import { SavedPage } from './pages/SavedPage';
import { Toast } from './components/Toast';

function QiahaoApp() {
  const { status, error, retry, login } = useQiahao();
  const { state } = useClub();
  const [activeTab, setActiveTab] = useState<AppTab>('activities');
  const [subview, setSubview] = useState<string | null>(null);
  const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  if (status === 'anonymous') return <LoginPage login={login} />;
  if (status === 'loading') return <main className="app-state"><p>正在打开恰好…</p></main>;
  if (status === 'error') return <main className="app-state"><p>{error ?? '暂时无法连接服务器'}</p><button onClick={retry}>重试</button></main>;
  if (!state.onboardingComplete) return <OnboardingFlow onComplete={() => { setActiveTab('activities'); setSubview(null); }} />;
  function changeTab(tab: AppTab) { setActiveTab(tab); setSubview(null); setSelectedNeed(null); window.scrollTo({ top: 0 }); }
  function profileNavigate(destination: ProfileDestination) { if (destination === 'portrait') return; if (destination === 'dynamics') return changeTab('needs'); setSubview(destination); window.scrollTo({ top: 0 }); }
  let content;
  if (selectedNeed) content = <NeedDetailPage need={selectedNeed} onBack={() => setSelectedNeed(null)} />;
  else if (subview === 'editor') content = <ProfileEditorPage onBack={() => setSubview(null)} />;
  else if (subview === 'messages') content = <MessagesPage />;
  else if (subview === 'saved-activities') content = <SavedPage onExplore={() => changeTab('explore')} onOpenActivity={() => setToast('活动详情已打开')} />;
  else if (subview === 'saved-needs' || subview === 'attended') content = <ProfileRecordsPage kind={subview} onBack={() => setSubview(null)} />;
  else if (subview === 'create-activity') content = <CreateActivityPage onCreated={() => { setToast('活动已发布，正在首页等候新搭子'); changeTab('activities'); }} />;
  else if (activeTab === 'explore') content = <ExplorePage />;
  else if (activeTab === 'needs') content = <NeedsPage onOpenNeed={setSelectedNeed} />;
  else if (activeTab === 'profile') content = <ProfilePage onNotice={setToast} onNavigate={profileNavigate} />;
  else content = <ActivitiesHomePage onExplore={() => changeTab('explore')} onNeeds={() => changeTab('needs')} onPublish={() => setSubview('create-activity')} />;
  return <AppShell activeTab={activeTab} onTabChange={changeTab}>{content}{toast && <Toast message={toast} onClose={() => setToast(null)} />}</AppShell>;
}
export default function App() { return <QiahaoProvider><ClubProvider><QiahaoApp /></ClubProvider></QiahaoProvider>; }
