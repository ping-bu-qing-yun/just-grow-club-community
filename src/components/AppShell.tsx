import type { ReactNode } from 'react';
import { BottomNav, type AppTab } from './BottomNav';

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
        <div className="app-shell__content">{children}</div>
        {showBottomNav ? <BottomNav activeTab={activeTab} onChange={onTabChange} onPublish={onPublish} /> : null}
      </div>
    </div>
  );
}
