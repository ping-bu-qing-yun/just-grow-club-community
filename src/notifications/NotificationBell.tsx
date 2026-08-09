import { Bell } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { quick } from '../motion/springs';
import { useNotifications } from './NotificationContext';
import styles from './NotificationBell.module.css';

export function NotificationBell({ onOpen }: { onOpen: () => void }) {
  const { unreadCount } = useNotifications();
  const reducedMotion = useReducedMotion();
  const label = unreadCount > 0 ? `通知，有${unreadCount > 99 ? '99+' : unreadCount}条未读` : '通知';
  return (
    <motion.button
      type="button"
      className={styles.bell}
      aria-label={label}
      onClick={onOpen}
      whileTap={reducedMotion ? { opacity: 0.6 } : { scale: 0.92 }}
      transition={quick}
    >
      <Bell size={20} />
      {unreadCount > 0 ? <i className={styles.dot} aria-hidden="true" /> : null}
    </motion.button>
  );
}
