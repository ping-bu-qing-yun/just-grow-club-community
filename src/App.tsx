import { useState } from 'react';
import { AppShell } from './components/AppShell';
import type { AppTab } from './components/BottomNav';
import { DiscoverPage } from './pages/DiscoverPage';
import { ActivityDetail } from './pages/ActivityDetail';
import { MessagesPage } from './pages/MessagesPage';
import { SavedPage } from './pages/SavedPage';
import { QiahaoProvider } from './state/QiahaoContext';
import { useQiahao } from './state/QiahaoContext';

function QiahaoApp() {
  const { activities } = useQiahao();
  const [activeTab, setActiveTab] = useState<AppTab>('discover');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const selectedActivity = activities.find((activity) => activity.id === selectedActivityId);

  function changeTab(tab: AppTab) {
    setSelectedActivityId(null);
    setActiveTab(tab);
  }

  let content;
  if (selectedActivity) {
    content = <ActivityDetail activity={selectedActivity} onBack={() => setSelectedActivityId(null)} />;
  } else if (activeTab === 'saved') {
    content = <SavedPage onExplore={() => changeTab('discover')} onOpenActivity={setSelectedActivityId} />;
  } else if (activeTab === 'messages') {
    content = <MessagesPage />;
  } else {
    content = <DiscoverPage onOpenActivity={setSelectedActivityId} />;
  }

  return <AppShell activeTab={activeTab} onTabChange={changeTab}>{content}</AppShell>;
}

export default function App() {
  return (
    <QiahaoProvider>
      <QiahaoApp />
    </QiahaoProvider>
  );
}
