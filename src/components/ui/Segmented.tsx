/**
 * Segmented — an iOS-style segmented control with a sliding thumb. The thumb
 * is a layout-animated element, so it glides between options with a spring
 * (SKILL §4) rather than a hard cut. Absorbs legacy .needs-mode / .qa-levels /
 * .notification-filters patterns.
 */
import { motion, useReducedMotion } from 'motion/react';
import { useId } from 'react';
import { snappy } from '../../motion/springs';
import styles from './Segmented.module.css';

export type SegmentedOption<T extends string = string> = {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
};

export type SegmentedProps<T extends string = string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible group label. */
  label?: string;
  size?: 'md' | 'sm';
};

export function Segmented<T extends string = string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
}: SegmentedProps<T>) {
  const reducedMotion = useReducedMotion();
  const layoutId = useId();

  return (
    <div className={`${styles.segmented} ${size === 'sm' ? styles.sm : ''}`} role="tablist" aria-label={label}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={option.disabled}
            className={`${styles.option} ${active ? styles.active : ''}`}
            onClick={() => onChange(option.value)}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                className={styles.thumb}
                transition={reducedMotion ? { duration: 0 } : snappy}
                aria-hidden="true"
              />
            ) : null}
            <span className={styles.text}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
