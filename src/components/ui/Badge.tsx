/**
 * Badge — a small label / count / tag chip. Absorbs legacy .club-tags span,
 * .category-label, and numeric count bubbles.
 */
import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Badge.module.css';

export type BadgeTone = 'brand' | 'green' | 'neutral' | 'warm' | 'solid';

export type BadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
} & HTMLAttributes<HTMLSpanElement>;

export function Badge({ tone = 'neutral', className = '', children, ...rest }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[tone]} ${className}`} {...rest}>
      {children}
    </span>
  );
}
