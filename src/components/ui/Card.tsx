/**
 * Card — the material content surface. Surfaces read as thicker when larger
 * (SKILL §12): bigger cards get a deeper shadow; interactive cards respond to
 * pointer-down with a subtle press and lift on hover.
 */
import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { quick } from '../../motion/springs';
import styles from './Card.module.css';

export type CardProps = {
  /** Visual weight: bigger surfaces read thicker (deeper shadow). */
  elevation?: 'flat' | 'raised' | 'floating';
  /** Render as a pressable control (adds press/hover feedback). */
  interactive?: boolean;
  children?: ReactNode;
  className?: string;
  onClick?: React.ComponentPropsWithoutRef<typeof motion.div>['onClick'];
} & Omit<React.ComponentPropsWithoutRef<typeof motion.div>, 'children' | 'className' | 'onClick'>;

export function Card({
  elevation = 'raised',
  interactive = false,
  className = '',
  children,
  onClick,
  ...rest
}: CardProps) {
  const reducedMotion = useReducedMotion();
  const classes = [styles.card, styles[elevation], interactive ? styles.interactive : '', className]
    .filter(Boolean)
    .join(' ');

  if (!interactive) {
    return (
      <motion.div className={classes} onClick={onClick} {...rest}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={classes}
      onClick={onClick}
      role="button"
      tabIndex={0}
      whileTap={reducedMotion ? { opacity: 0.7 } : { scale: 0.99 }}
      transition={quick}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
