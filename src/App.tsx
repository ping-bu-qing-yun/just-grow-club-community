import { useState } from 'react';
import { AppShell } from './components/AppShell';
import type { AppTab } from './components/BottomNav';
import { DiscoverPage } from './pages/DiscoverPage';
import { QiahaoProvider } from './state/QiahaoContext';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('discover');

  return (
    <QiahaoProvider>
      <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
        <DiscoverPage onOpenActivity={() => undefined} />
      </AppShell>
    </QiahaoProvider>
  );
}
