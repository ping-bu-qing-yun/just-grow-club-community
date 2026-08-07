import { useState } from 'react';
import { AppShell } from './components/AppShell';
import type { AppTab } from './components/BottomNav';
import { DiscoverPage } from './pages/DiscoverPage';
import { ActivityDetail } from './pages/ActivityDetail';
import { MessagesPage } from './pages/MessagesPage';
import { SavedPage } from './pages/SavedPage';
import { CreateActivityPage } from './pages/CreateActivityPage';
import { ProfilePage } from './pages/ProfilePage';
import { QiahaoProvider } from './state/QiahaoContext';
import { useQiahao } from './state/QiahaoContext';
import { Toast } from './components/Toast';

function QiahaoApp() {
  const { activities } = useQiahao();
  const [activeTab, setActiveTab] = useState<AppTab>('discover');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const selectedActivity = activities.find((activity) => activity.id === selectedActivityId);

  function changeTab(tab: AppTab) {
    setSelectedActivityId(null);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function openActivity(activityId: string) {
    setSelectedActivityId(activityId);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  let content;
  if (selectedActivity) {
    content = <ActivityDetail activity={selectedActivity} onBack={() => { setSelectedActivityId(null); window.scrollTo({ top: 0 }); }} />;
  } else if (activeTab === 'saved') {
    content = <SavedPage onExplore={() => changeTab('discover')} onOpenActivity={openActivity} />;
  } else if (activeTab === 'messages') {
    content = <MessagesPage />;
  } else if (activeTab === 'create') {
    content = <CreateActivityPage onCreated={() => { setToast('活动已发布，正在首页等候新搭子'); changeTab('discover'); }} />;
  } else if (activeTab === 'profile') {
    content = <ProfilePage onNotice={setToast} />;
  } else {
    content = <DiscoverPage onOpenActivity={openActivity} />;
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={changeTab}>
      {content}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AppShell>
  );
}

export default function App() {
  return (
    <QiahaoProvider>
      <QiahaoApp />
    </QiahaoProvider>
  );
}
