import { CalendarHeart, Compass, MessagesSquare, Plus, UserRound } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { quick } from '../motion/springs';
import styles from './BottomNav.module.css';

export type AppTab = 'activities' | 'explore' | 'needs' | 'profile';

export const appNavigationItems = [
  { id: 'activities' as const, label: '活动', Icon: CalendarHeart },
  { id: 'explore' as const, label: '发现', Icon: Compass },
  { id: 'needs' as const, label: '需求', Icon: MessagesSquare },
  { id: 'profile' as const, label: '我的', Icon: UserRound },
];

export function BottomNav({
  activeTab,
  onChange,
  onPublish,
}: {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
  onPublish: () => void;
}) {
  const left = appNavigationItems.slice(0, 2);
  const right = appNavigationItems.slice(2);
  const reducedMotion = useReducedMotion();
  const press = reducedMotion ? { opacity: 0.6 } : { scale: 0.94 };

  const renderItem = ({ id, label, Icon }: (typeof appNavigationItems)[number]) => (
    <motion.button
      key={id}
      type="button"
      className={`${styles.item} ${activeTab === id ? styles.active : ''}`}
      aria-current={activeTab === id ? 'page' : undefined}
      onClick={() => onChange(id)}
      whileTap={press}
      transition={quick}
    >
      <span className={styles.icon}>
        <Icon size={22} strokeWidth={2} />
      </span>
      <span>{label}</span>
    </motion.button>
  );

  return (
    <nav className={styles.nav} aria-label="主要导航">
      {left.map(renderItem)}

      <motion.button
        type="button"
        className={`${styles.item} ${styles.create}`}
        aria-label="发布"
        onClick={onPublish}
        whileTap={press}
        transition={quick}
      >
        <span className={styles.createIcon}>
          <Plus size={26} strokeWidth={2.4} />
        </span>
        <span>发布</span>
      </motion.button>

      {right.map(renderItem)}
    </nav>
  );
}
