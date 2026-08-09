/**
 * Pressable.tsx — instant pointer-down feedback wrapper (SKILL §1).
 *
 * The moment lag appears, directness "falls off a cliff" — so feedback lives on
 * the press, not the release. While pressed we scale down 1:1; on release we
 * settle back with a critically-damped spring so the return is interruptible
 * and velocity-aware (never a fixed CSS keyframe, SKILL §3).
 *
 * Reduced motion: drop the scale, keep a gentle opacity dip instead (SKILL §14).
 */
import { motion, useReducedMotion } from 'motion/react';
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { quick } from './springs';

type PressableProps = {
  children: ReactNode;
  /** Render as a different element/component (default 'div'). */
  as?: ElementType;
  /** Scale applied while pressed. Default 0.97 (Apple's button press). */
  pressScale?: number;
  /** Disable the press animation (still renders children/handlers). */
  disablePress?: boolean;
} & ComponentPropsWithoutRef<typeof motion.div>;

export function Pressable({
  children,
  as,
  pressScale = 0.97,
  disablePress = false,
  ...rest
}: PressableProps) {
  const reducedMotion = useReducedMotion();
  const Component = (as ?? motion.div) as typeof motion.div;

  if (disablePress) {
    return <Component {...rest}>{children}</Component>;
  }

  return (
    <Component
      {...rest}
      whileTap={
        reducedMotion
          ? { opacity: 0.6 } // non-vestibular equivalent (SKILL §14)
          : { scale: pressScale }
      }
      transition={quick}
    >
      {children}
    </Component>
  );
}
