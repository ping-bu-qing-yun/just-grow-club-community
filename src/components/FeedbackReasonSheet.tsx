import { motion, useReducedMotion } from 'motion/react';
import { quick } from '../motion/springs';
import { Sheet } from './Sheet';
import styles from './FeedbackReasonSheet.module.css';

export function DislikeReasonSheet({
  options,
  onSelect,
  onClose,
}: {
  options: Array<{ key: string; label: string }>;
  onSelect: (key: string, label: string) => void;
  onClose: () => void;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <Sheet label="选择不考虑原因" onClose={onClose} className={styles.sheet}>
      <h2 className={styles.title}>你为什么不考虑？</h2>
      <p className={styles.subtitle}>你的选择会让推荐更准确</p>
      <div className={styles.grid}>
        {options.map((reason) => (
          <motion.button
            key={reason.key}
            type="button"
            className={styles.option}
            onClick={() => onSelect(reason.key, reason.label)}
            whileTap={reducedMotion ? { opacity: 0.7 } : { scale: 0.98 }}
            transition={quick}
          >
            {reason.label}
          </motion.button>
        ))}
      </div>
    </Sheet>
  );
}
