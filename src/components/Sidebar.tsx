import { Plus } from 'lucide-react';
import { appNavigationItems, type AppTab } from './BottomNav';

export function Sidebar({
  activeTab,
  onChange,
  onPublish,
}: {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
  onPublish: () => void;
}) {
  return (
    <aside className="app-sidebar" aria-label="桌面导航">
      <div className="app-sidebar__brand" aria-label="恰好俱乐部">
        <span>恰好</span>
        <small>CLUB</small>
      </div>
      <nav className="app-sidebar__nav" aria-label="主要导航">
        {appNavigationItems.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={activeTab === id ? 'is-active' : undefined}
            aria-current={activeTab === id ? 'page' : undefined}
            onClick={() => onChange(id)}
          >
            <Icon size={21} strokeWidth={2} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <button type="button" className="app-sidebar__publish" onClick={onPublish}>
        <Plus size={20} strokeWidth={2.4} />
        <span>发布</span>
      </button>
      <p>让每次见面，都刚刚好。</p>
    </aside>
  );
}
