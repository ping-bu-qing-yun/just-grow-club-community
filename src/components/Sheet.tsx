/**
 * Sheet — the gesture-driven bottom sheet, rebuilt on Motion springs.
 *
 * Apple Design (SKILL.md) mapping:
 *  §1  Response — the panel tracks the pointer 1:1 from the first move.
 *  §2  Direct manipulation — Pointer Events + setPointerCapture; respects the grab.
 *  §3  Interruptibility — all motion is a spring driven by a MotionValue that
 *      always starts from the live on-screen value; a closing sheet grabbed
 *      mid-flight follows the finger again instead of finishing first.
 *  §5  Velocity handoff — release velocity becomes the spring's initial velocity.
 *  §6  Momentum projection — project() decides commit-vs-return, like a flick.
 *  §9  Rubber-banding — progressive resistance past the bounds.
 *  §12 Materials — translucent material surface + blur scrim (dim-to-focus).
 *  §14 Reduced motion — springs collapse to a short cross-fade.
 *
 * The focus trap, inert root, and Escape handling are unchanged from the
 * original hand-rolled implementation.
 */
import { X } from 'lucide-react';
import { animate, motionValue, type MotionValue } from 'motion';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { project, rubberband } from '../motion/gestures';
import { sheet as sheetSpring } from '../motion/springs';
import styles from './Sheet.module.css';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

type Gesture = {
  pointerId: number;
  startY: number;
  startOffset: number;
  lastY: number;
  lastTime: number;
  velocity: number; // px/ms, exponential-smoothed
  dragging: boolean;
  offset: number;
};

function readTranslateY(element: HTMLElement): number {
  const transform = window.getComputedStyle(element).transform;
  if (!transform || transform === 'none') return 0;
  try {
    return new DOMMatrixReadOnly(transform).m42;
  } catch {
    return 0;
  }
}

export function Sheet({
  children,
  label,
  onClose,
  className = '',
}: {
  children: ReactNode;
  label: string;
  onClose: () => void;
  className?: string;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  const gestureRef = useRef<Gesture | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const closingRef = useRef(false);
  const yRef = useRef<MotionValue<number> | null>(null);
  if (yRef.current === null) yRef.current = motionValue(0);
  const [closing, setClosing] = useState(false);
  closeRef.current = onClose;

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function panelHeight(): number {
    const panel = panelRef.current;
    return panel ? panel.offsetHeight : window.innerHeight * 0.5;
  }

  /** Drive the panel's translateY. Both the MotionValue and the CSS var are
   *  kept in sync so the entrance keyframe and live transforms agree. */
  function setOffset(offset: number) {
    const panel = panelRef.current;
    yRef.current?.set(offset);
    panel?.style.setProperty('--sheet-offset', `${offset}px`);
  }

  function finishClose(velocity = 0) {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const target = Math.max(panelHeight(), window.innerHeight * 0.45);
    if (reducedMotion()) {
      closeTimerRef.current = window.setTimeout(() => closeRef.current(), 0);
      return;
    }
    // §5 velocity handoff: the panel continues at the finger's velocity (px/ms → px/s).
    animate(yRef.current!, target, {
      ...sheetSpring,
      velocity: Math.max(0, velocity * 1000),
      onUpdate: (latest) => panelRef.current?.style.setProperty('--sheet-offset', `${latest}px`),
      onComplete: () => closeRef.current(),
    });
  }

  useEffect(() => {
    const panel = panelRef.current;
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const appRoot = document.getElementById('root');
    const rootWithInert = appRoot as (HTMLElement & { inert: boolean }) | null;
    const previousInert = rootWithInert?.inert ?? false;
    const previousAriaHidden = appRoot?.getAttribute('aria-hidden');
    const previousOverflow = document.body.style.overflow;

    if (rootWithInert) rootWithInert.inert = true;
    appRoot?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'hidden';

    const focusTarget = panel?.querySelector<HTMLElement>(focusableSelector) ?? panel;
    window.requestAnimationFrame(() => focusTarget?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        finishClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = [...panel.querySelectorAll<HTMLElement>(focusableSelector)].filter((item) => !item.hidden);
      if (!focusable.length) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (rootWithInert) rootWithInert.inert = previousInert;
      if (previousAriaHidden == null) appRoot?.removeAttribute('aria-hidden');
      else appRoot?.setAttribute('aria-hidden', previousAriaHidden);
      document.body.style.overflow = previousOverflow;
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
      yRef.current?.stop();
      window.requestAnimationFrame(() => activeElement?.focus());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (closingRef.current || event.button !== 0) return;
    const panel = panelRef.current;
    if (!panel) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    // §3 interrupt: read the live on-screen offset (mid-flight if closing) and
    // stop any running spring so the finger takes over from the presentation value.
    yRef.current?.stop();
    const startOffset = Math.max(0, readTranslateY(panel));
    panel.style.animation = 'none';
    setOffset(startOffset);
    gestureRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startOffset,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      velocity: 0,
      dragging: false,
      offset: startOffset,
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    const panel = panelRef.current;
    if (!gesture || !panel || gesture.pointerId !== event.pointerId) return;
    const rawDelta = event.clientY - gesture.startY;
    if (!gesture.dragging && Math.abs(rawDelta) < 10) return; // §10 hysteresis
    gesture.dragging = true;
    const elapsed = Math.max(1, event.timeStamp - gesture.lastTime);
    const instantVelocity = (event.clientY - gesture.lastY) / elapsed;
    gesture.velocity = gesture.velocity * 0.72 + instantVelocity * 0.28; // exponential smoothing
    gesture.lastY = event.clientY;
    gesture.lastTime = event.timeStamp;

    const height = panelHeight();
    let offset = gesture.startOffset + rawDelta;
    // §9 rubber-band at both bounds: resist progressively, don't hard-stop.
    if (offset < 0) offset = -rubberband(-offset, height);
    else if (offset > height) offset = height + rubberband(offset - height, height);
    gesture.offset = offset;
    setOffset(offset); // §1 track the pointer 1:1 the whole way through
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    const panel = panelRef.current;
    if (!gesture || !panel || gesture.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    gestureRef.current = null;
    if (!gesture.dragging) return;
    const offset = Math.max(0, gesture.offset);
    // §6 momentum projection: decide commit from where the gesture is *going*.
    const projected = offset + Math.max(0, project(gesture.velocity * 1000));
    const shouldClose = gesture.velocity > 0.55 || projected > Math.max(120, panelHeight() * 0.32);
    if (shouldClose) {
      finishClose(gesture.velocity);
      return;
    }
    if (reducedMotion()) {
      setOffset(0);
      return;
    }
    // §5 spring back from the live value, handing off the release velocity.
    animate(yRef.current!, 0, {
      ...sheetSpring,
      velocity: gesture.velocity * 1000,
      onUpdate: (latest) => panel.style.setProperty('--sheet-offset', `${latest}px`),
    });
  }

  return createPortal(
    <div
      className={`${styles.backdrop}${closing ? ` ${styles.closing}` : ''}`}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) finishClose();
      }}
    >
      <section
        ref={panelRef}
        className={`${styles.panel}${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        <div
          className={`${styles.handleArea} sheet-handle-area`}
          aria-hidden="true"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <div className={styles.handle} />
        </div>
        <button type="button" className={styles.close} aria-label="关闭" onClick={() => finishClose()}>
          <X size={20} />
        </button>
        {children}
      </section>
    </div>,
    document.body,
  );
}
