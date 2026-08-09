import type { ReactNode } from 'react';
import { BottomNav, type AppTab } from './BottomNav';
import { Sidebar } from './Sidebar';
import styles from './AppShell.module.css';

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
    <div className={styles.canvas}>
      <div className={styles.shell}>
        <Sidebar activeTab={activeTab} onChange={onTabChange} onPublish={onPublish} />
        <div className={styles.content}>{children}</div>
        {showBottomNav ? <BottomNav activeTab={activeTab} onChange={onTabChange} onPublish={onPublish} /> : null}
      </div>
    </div>
  );
}
