/**
 * springs.ts — Apple spring presets mapped to Motion's bounce+duration API.
 *
 * SKILL §4: Apple reasons about springs with two designer-friendly params:
 *   - Damping ratio  (overshoot)  → Motion `bounce`  (0 = critically damped)
 *   - Response       (seconds)    → Motion `duration`
 *
 * House style (SKILL §4 "safe house style"): critically damped (bounce 0)
 * everywhere by default; reserve bounce for momentum-driven, physical
 * interactions (a flick, a throw, a drag release).
 */
import type { Transition } from 'motion/react';

/** Default UI spring — critically damped, no overshoot (SKILL §4 move/reposition: damping 1.0, response 0.4). */
export const snappy: Transition = { type: 'spring', bounce: 0, duration: 0.4 };

/** Slightly quicker critically-damped settle for small chrome / press releases. */
export const quick: Transition = { type: 'spring', bounce: 0, duration: 0.28 };

/** Momentum spring — a little bounce, only because a gesture carried velocity (SKILL §4: damping ~0.8, response 0.4). */
export const momentum: Transition = { type: 'spring', bounce: 0.2, duration: 0.4 };

/** Drawer / sheet spring (SKILL §4 concrete value: damping 0.8, response 0.3). */
export const sheet: Transition = { type: 'spring', bounce: 0.2, duration: 0.3 };

/** Gentle non-vestibular fallback for reduced motion: short cross-fade, no translate. */
export const reducedFade: Transition = { duration: 0.2, ease: 'easeOut' };
