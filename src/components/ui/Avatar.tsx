/**
 * Avatar — a circular user avatar with an initial-letter fallback, plus an
 * AvatarStack that overlaps a row of them with a "+N" remainder.
 */
import type { HTMLAttributes } from 'react';
import type { UserSummary } from '../../domain/types';
import styles from './Avatar.module.css';

export type AvatarProps = {
  src?: string | null;
  name?: string;
  size?: number;
} & HTMLAttributes<HTMLSpanElement>;

export function Avatar({ src, name = '', size = 40, className = '', ...rest }: AvatarProps) {
  const initial = name.trim().charAt(0);
  return (
    <span
      className={`${styles.avatar} ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      {...rest}
    >
      {src ? <img src={src} alt={name} /> : <span aria-hidden="true">{initial || '·'}</span>}
    </span>
  );
}

export function AvatarStack({ users, max = 3, size = 25 }: { users: UserSummary[]; max?: number; size?: number }) {
  const visible = users.slice(0, max);
  const remainder = users.length - visible.length;

  return (
    <div className={styles.stack} aria-label={`${users.length} 人已加入`}>
      {visible.map((user) => (
        <span key={user.id} className={styles.stackItem} style={{ width: size, height: size }}>
          <img src={user.avatar} alt={user.name} />
        </span>
      ))}
      {remainder > 0 && (
        <span className={`${styles.stackItem} ${styles.remainder}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.32) }}>
          +{remainder}
        </span>
      )}
    </div>
  );
}
