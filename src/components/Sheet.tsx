import { X } from 'lucide-react';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

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
  velocity: number;
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
  const [closing, setClosing] = useState(false);
  closeRef.current = onClose;

  function finishClose() {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const panel = panelRef.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (panel) {
      panel.style.transition = reducedMotion ? 'none' : 'transform 180ms cubic-bezier(.32,.72,0,1)';
      panel.style.setProperty('--sheet-offset', `${Math.max(panel.offsetHeight, window.innerHeight * 0.45)}px`);
    }
    closeTimerRef.current = window.setTimeout(() => closeRef.current(), reducedMotion ? 0 : 180);
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
      window.requestAnimationFrame(() => activeElement?.focus());
    };
  }, []);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (closingRef.current || event.button !== 0) return;
    const panel = panelRef.current;
    if (!panel) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const startOffset = Math.max(0, readTranslateY(panel));
    panel.style.animation = 'none';
    panel.style.transition = 'none';
    panel.style.setProperty('--sheet-offset', `${startOffset}px`);
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
    if (!gesture.dragging && Math.abs(rawDelta) < 10) return;
    gesture.dragging = true;
    const elapsed = Math.max(1, event.timeStamp - gesture.lastTime);
    const instantVelocity = (event.clientY - gesture.lastY) / elapsed;
    gesture.velocity = gesture.velocity * 0.72 + instantVelocity * 0.28;
    gesture.lastY = event.clientY;
    gesture.lastTime = event.timeStamp;

    let offset = gesture.startOffset + rawDelta;
    if (offset < 0) offset *= 0.18;
    if (offset > panel.offsetHeight) offset = panel.offsetHeight + (offset - panel.offsetHeight) * 0.18;
    gesture.offset = offset;
    panel.style.setProperty('--sheet-offset', `${offset}px`);
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    const panel = panelRef.current;
    if (!gesture || !panel || gesture.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    gestureRef.current = null;
    if (!gesture.dragging) return;
    const offset = Math.max(0, gesture.offset);
    const projectedOffset = offset + Math.max(0, gesture.velocity) * 220;
    const shouldClose = gesture.velocity > 0.55 || projectedOffset > Math.max(120, panel.offsetHeight * 0.32);
    if (shouldClose) {
      finishClose();
      return;
    }
    panel.style.transition = 'transform 320ms cubic-bezier(.22,.8,.28,1)';
    panel.style.setProperty('--sheet-offset', '0px');
  }

  return createPortal(
    <div className={`sheet-backdrop${closing ? ' is-closing' : ''}`} onPointerDown={(event) => { if (event.target === event.currentTarget) finishClose(); }}>
      <section
        ref={panelRef}
        className={`bottom-sheet${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        <div
          className="sheet-handle-area"
          aria-hidden="true"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <div className="sheet-handle" />
        </div>
        <button type="button" className="icon-button sheet-close" aria-label="关闭" onClick={finishClose}><X size={20} /></button>
        {children}
      </section>
    </div>,
    document.body,
  );
}
