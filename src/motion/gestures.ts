/**
 * gestures.ts — the math behind Apple's fluid gestures (SKILL §5, §6, §9).
 * Pure functions, no DOM — safe to unit test.
 */

/**
 * SKILL §6 — momentum projection. Apple's exact exponential-decay form from
 * the Designing Fluid Interfaces sample code (NOT the physics-textbook v²/2·decel).
 *
 * @param initialVelocity px/s
 * @param decelerationRate ≈ 0.998 for normal scroll feel; 0.99 for snappier
 * @returns px the gesture will travel beyond the release point
 */
export function project(initialVelocity: number, decelerationRate = 0.998): number {
  return (initialVelocity / 1000) * (decelerationRate / (1 - decelerationRate));
}

/**
 * The resting position a flick is heading toward: current + projected travel.
 * Choose the snap target nearest this endpoint, then hand off velocity (§5).
 */
export function projectedEndpoint(current: number, releaseVelocity: number, decelerationRate = 0.998): number {
  return current + project(releaseVelocity, decelerationRate);
}

/**
 * SKILL §9 — rubber-band resistance at a soft boundary. The further past the
 * bound, the less the element follows; real things slow before they stop.
 *
 * @param overshoot how far past the boundary the pointer is (px)
 * @param dimension the dimension being resisted against (e.g. sheet height)
 * @param constant  Apple ships 0.55
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/**
 * SKILL §5 — velocity handoff. Some spring APIs want RELATIVE velocity:
 * normalize the pointer's release velocity by the remaining distance.
 * Motion's `animate` accepts absolute px/s directly, so prefer passing the raw
 * velocity there; use this only when a normalized value is required.
 */
export function relativeVelocity(gestureVelocity: number, current: number, target: number): number {
  const remaining = target - current;
  if (remaining === 0) return 0;
  return gestureVelocity / remaining;
}

/**
 * A short velocity/position history tracker (SKILL §2: track the last few
 * pointermove events, not just the current point). Feed it pointermove samples
 * and read the smoothed release velocity at pointerup.
 */
export type VelocitySample = { value: number; time: number };

export class VelocityTracker {
  private samples: VelocitySample[] = [];
  /** Keep a short window; ~100ms of history is plenty for a stable flick velocity. */
  constructor(private windowMs = 100, private maxSamples = 8) {}

  add(value: number, time: number): void {
    this.samples.push({ value, time });
    if (this.samples.length > this.maxSamples) this.samples.shift();
  }

  /** Smoothed velocity in px/s (exponential blend like iOS). Returns 0 with <2 samples. */
  velocity(now: number): number {
    const recent = this.samples.filter((s) => now - s.time <= this.windowMs);
    if (recent.length < 2) return 0;
    const first = recent[0];
    const last = recent[recent.length - 1];
    const dt = last.time - first.time;
    if (dt <= 0) return 0;
    return ((last.value - first.value) / dt) * 1000;
  }

  reset(): void {
    this.samples = [];
  }
}
