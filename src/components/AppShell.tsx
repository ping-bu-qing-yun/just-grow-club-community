import type { ReactNode } from 'react';
import { BottomNav, type AppTab } from './BottomNav';

export function AppShell({ children, activeTab, onTabChange }: {
  children: ReactNode;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}) {
  return (
    <div className="app-canvas">
      <div className="app-shell">
        <div className="app-shell__content">{children}</div>
        <BottomNav activeTab={activeTab} onChange={onTabChange} />
      </div>
    </div>
  );
}

