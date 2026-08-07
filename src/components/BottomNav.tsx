import { Compass, Heart, MessageCircle, Plus, UserRound } from 'lucide-react';

export type AppTab = 'discover' | 'saved' | 'create' | 'messages' | 'profile';

const items = [
  { id: 'discover' as const, label: '发现', Icon: Compass },
  { id: 'saved' as const, label: '心愿', Icon: Heart },
  { id: 'create' as const, label: '发布', Icon: Plus },
  { id: 'messages' as const, label: '消息', Icon: MessageCircle },
  { id: 'profile' as const, label: '我的', Icon: UserRound },
];

export function BottomNav({ activeTab, onChange }: { activeTab: AppTab; onChange: (tab: AppTab) => void }) {
  return (
    <nav className="bottom-nav" aria-label="主要导航">
      {items.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`bottom-nav__item bottom-nav__item--${id}${activeTab === id ? ' is-active' : ''}`}
          aria-current={activeTab === id ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          <span className="bottom-nav__icon"><Icon size={id === 'create' ? 24 : 21} strokeWidth={2.1} /></span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

