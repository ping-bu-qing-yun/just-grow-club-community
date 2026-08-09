/**
 * useSpring.ts — a single-value spring with velocity inheritance (SKILL §3).
 *
 * The single most important fluid-interface principle is interruptibility: a
 * user must be able to grab a moving value mid-flight and redirect it without
 * a jump or a "brick wall" of velocity discontinuity. This hook wraps a Motion
 * `MotionValue`, whose spring always starts from the CURRENT (presentation)
 * value and carries the current velocity into each re-target — exactly what
 * interruption needs.
 *
 * Usage:
 *   const y = useSpring(0, momentum);
 *   y.set(120);            // animates from live value, inherits velocity
 *   y.get();               // current on-screen value
 *   y.jump(0);             // snap instantly (no animation)
 */
import { useEffect, useRef } from 'react';
import { animate, motionValue, type MotionValue, type Transition } from 'motion';
import { snappy } from './springs';

export type SpringValue = {
  /** Animate to a target from the live value, optionally seeding initial velocity (px/s, SKILL §5). */
  set: (target: number, opts?: { velocity?: number; transition?: Transition; onComplete?: () => void }) => void;
  /** Read the current on-screen value. */
  get: () => number;
  /** Snap to a value with no animation and reset velocity. */
  jump: (value: number) => void;
  /** Current velocity (px/s). */
  getVelocity: () => number;
  /** Stop the in-flight animation (keeps current value). */
  stop: () => void;
  /** Subscribe to value changes. Returns unsubscribe. */
  on: (cb: (value: number) => void) => () => void;
  /** The underlying MotionValue — bind directly to a motion style prop if needed. */
  motionValue: MotionValue<number>;
};

export function useSpring(initial: number, defaultTransition: Transition = snappy): SpringValue {
  const mv = useRef<MotionValue<number> | null>(null);
  if (mv.current === null) mv.current = motionValue(initial);
  const transitionRef = useRef(defaultTransition);
  transitionRef.current = defaultTransition;

  useEffect(() => {
    const value = mv.current!;
    return () => {
      value.stop();
      value.destroy();
    };
  }, []);

  // Stable API object; safe to capture in effects/handlers.
  const api = useRef<SpringValue>({
    motionValue: mv.current,
    set(target, opts) {
      const value = mv.current!;
      // animate() on a MotionValue starts from its current value and inherits
      // its velocity by default (SKILL §3); an explicit gesture velocity (§5)
      // overrides for a seamless drag→spring handoff.
      animate(value, target, {
        ...(opts?.transition ?? transitionRef.current),
        ...(opts?.velocity !== undefined ? { velocity: opts.velocity } : {}),
        onComplete: opts?.onComplete,
      });
    },
    get: () => mv.current!.get(),
    jump(next) {
      mv.current!.jump(next);
    },
    getVelocity: () => mv.current!.getVelocity(),
    stop() {
      mv.current!.stop();
    },
    on(cb) {
      return mv.current!.on('change', cb);
    },
  });

  return api.current;
}
