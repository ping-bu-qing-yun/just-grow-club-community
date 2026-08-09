import { Plus } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { quick } from '../motion/springs';
import { appNavigationItems, type AppTab } from './BottomNav';
import styles from './Sidebar.module.css';

export function Sidebar({
  activeTab,
  onChange,
  onPublish,
}: {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
  onPublish: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const press = reducedMotion ? { opacity: 0.6 } : { scale: 0.98 };

  return (
    <aside className={styles.sidebar} aria-label="桌面导航">
      <div className={styles.brand} aria-label="恰好俱乐部">
        <span>恰好</span>
        <small>CLUB</small>
      </div>
      <nav className={styles.nav} aria-label="主要导航">
        {appNavigationItems.map(({ id, label, Icon }) => (
          <motion.button
            key={id}
            type="button"
            className={`${styles.item} ${activeTab === id ? styles.active : ''}`}
            aria-current={activeTab === id ? 'page' : undefined}
            onClick={() => onChange(id)}
            whileTap={press}
            transition={quick}
          >
            <Icon size={21} strokeWidth={2} />
            <span>{label}</span>
          </motion.button>
        ))}
      </nav>
      <motion.button type="button" className={styles.publish} onClick={onPublish} whileTap={press} transition={quick}>
        <Plus size={20} strokeWidth={2.4} />
        <span>发布</span>
      </motion.button>
      <p className={styles.tagline}>让每次见面，都刚刚好。</p>
    </aside>
  );
}
