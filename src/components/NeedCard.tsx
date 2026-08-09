import { Bookmark, Heart, MessageCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { Need } from '../club/types';
import { quick } from '../motion/springs';
import { useQiahao } from '../state/QiahaoContext';
import { Badge } from './ui/Badge';
import styles from './NeedCard.module.css';

export function NeedCard({
  need,
  onOpen,
}: {
  need: Need;
  onOpen: (need: Need, focusComments?: boolean) => void;
}) {
  const { toggleContentSaved, toggleContentResonance } = useQiahao();
  const reducedMotion = useReducedMotion();
  const saved = Boolean(need.saved);
  const resonated = Boolean(need.resonated);

  return (
    <article className={styles.card}>
      <motion.button
        type="button"
        className={styles.media}
        onClick={() => onOpen(need)}
        whileTap={reducedMotion ? { opacity: 0.8 } : { scale: 0.99 }}
        transition={quick}
      >
        <img src={need.image} alt="" />
        <span className={styles.subtitle}>{need.subtitle}</span>
      </motion.button>
      <div className={styles.content}>
        <small className={styles.author}>{need.author}</small>
        <button type="button" className={styles.title} onClick={() => onOpen(need)}>
          <h3>{need.title}</h3>
        </button>
        <p className={styles.copy}>{need.copy}</p>
        <div className={styles.tags}>
          {need.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={resonated ? styles.active : ''}
            onClick={() => toggleContentResonance('need', need.id)}
            aria-label={resonated ? '已共鸣' : '我也有'}
          >
            <Heart size={17} aria-hidden fill={resonated ? 'currentColor' : 'none'} />
            {need.resonance + (resonated ? 1 : 0)}
          </button>
          <button type="button" onClick={() => onOpen(need, true)} aria-label={`查看${need.title}评论`}>
            <MessageCircle size={17} aria-hidden />
            {need.comments}
          </button>
          <button
            type="button"
            className={saved ? styles.active : ''}
            onClick={() => toggleContentSaved('need', need.id)}
            aria-label={saved ? '已收藏' : '收藏'}
          >
            <Bookmark size={17} aria-hidden fill={saved ? 'currentColor' : 'none'} />
            {saved ? '已收藏' : '收藏'}
          </button>
        </div>
      </div>
    </article>
  );
}
