import type { ReactNode } from 'react';
import { BottomNav, type AppTab } from './BottomNav';
import { Sidebar } from './Sidebar';

export function AppShell({
  children,
  activeTab,
  onTabChange,
  onPublish,
  showBottomNav = true,
}: {
  children: ReactNode;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onPublish: () => void;
  showBottomNav?: boolean;
}) {
  return (
    <div className="app-canvas">
      <div className="app-shell">
        <Sidebar activeTab={activeTab} onChange={onTabChange} onPublish={onPublish} />
        <div className="app-shell__content">{children}</div>
        {showBottomNav ? <BottomNav activeTab={activeTab} onChange={onTabChange} onPublish={onPublish} /> : null}
      </div>
    </div>
  );
}
