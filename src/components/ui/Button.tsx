/**
 * Button — the pressable control, in four variants. Absorbs the legacy
 * .primary-button / .secondary-button / .text-button / .icon-button classes.
 *
 * Feedback is instant on pointer-down (SKILL §1) via Pressable; the press
 * scale settles back with a spring, never a fixed keyframe (SKILL §3).
 */
import { motion, useReducedMotion } from 'motion/react';
import { forwardRef, type ReactNode } from 'react';
import { quick } from '../../motion/springs';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'icon';
export type ButtonSize = 'md' | 'sm' | 'lg';

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to full container width. */
  wide?: boolean;
  /** Leading icon node. */
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
} & Omit<React.ComponentPropsWithoutRef<typeof motion.button>, 'children' | 'className' | 'disabled'>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', wide = false, icon, className = '', children, disabled, type = 'button', ...rest },
  ref,
) {
  const reducedMotion = useReducedMotion();
  const classes = [
    styles.button,
    styles[variant],
    size !== 'md' ? styles[size] : '',
    wide ? styles.wide : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled}
      whileTap={disabled ? undefined : reducedMotion ? { opacity: 0.6 } : { scale: 0.97 }}
      transition={quick}
      {...rest}
    >
      {icon ? <span className={styles.leadingIcon} aria-hidden="true">{icon}</span> : null}
      {variant === 'icon' ? <span className={styles.iconOnly}>{children}</span> : children}
    </motion.button>
  );
});
