import { CalendarHeart, MessagesSquare, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { quick } from '../motion/springs';
import { Sheet } from './Sheet';
import styles from './PublishTypeSheet.module.css';

export type PublishKind = 'activity' | 'need' | 'life';

export function PublishTypeSheet({
  canPublishActivity,
  onSelect,
  onClose,
}: {
  canPublishActivity: boolean;
  onSelect: (kind: PublishKind) => void;
  onClose: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const options = [
    canPublishActivity
      ? {
          id: 'activity' as const,
          label: '活动',
          description: '发起一场可报名的线下见面',
          Icon: CalendarHeart,
        }
      : null,
    {
      id: 'need' as const,
      label: '需求',
      description: '直接说出你想遇见什么',
      Icon: MessagesSquare,
    },
    {
      id: 'life' as const,
      label: '生活',
      description: '分享日常，让人先看见彼此',
      Icon: Sparkles,
    },
  ].filter(Boolean) as Array<{
    id: PublishKind;
    label: string;
    description: string;
    Icon: typeof CalendarHeart;
  }>;

  return (
    <Sheet label="选择发布类型" onClose={onClose} className={styles.sheet}>
      <h2 className={styles.title}>想发布什么？</h2>
      <p className={styles.subtitle}>{canPublishActivity ? '运营者可发布活动、需求与生活' : '你可以发布需求或生活动态'}</p>
      <div className={styles.list}>
        {options.map(({ id, label, description, Icon }) => (
          <motion.button
            key={id}
            type="button"
            className={styles.option}
            onClick={() => onSelect(id)}
            whileTap={reducedMotion ? { opacity: 0.7 } : { scale: 0.98 }}
            transition={quick}
          >
            <span className={`${styles.icon} ${styles[`icon--${id}`]}`}>
              <Icon size={20} />
            </span>
            <span className={styles.copy}>
              <strong>{label}</strong>
              <small>{description}</small>
            </span>
          </motion.button>
        ))}
      </div>
    </Sheet>
  );
}
