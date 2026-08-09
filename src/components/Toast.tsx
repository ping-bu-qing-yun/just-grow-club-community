import { CheckCircle2, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { snappy } from '../motion/springs';
import styles from './Toast.module.css';

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  const reducedMotion = useReducedMotion();
  return (
    <AnimatePresence>
      <motion.div
        className={styles.toast}
        role="status"
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
        transition={snappy}
      >
        <CheckCircle2 size={19} className={styles.icon} />
        <span>{message}</span>
        <button type="button" className={styles.close} aria-label="关闭提示" onClick={onClose}>
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
