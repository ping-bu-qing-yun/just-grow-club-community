import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';

const ORIGIN = { x: 0, y: 0 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function InteractiveCatMascot() {
  const catRef = useRef<HTMLButtonElement | null>(null);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, x: 0, y: 0, moved: false });
  const [position, setPosition] = useState(ORIGIN);
  const [dragging, setDragging] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [pouncing, setPouncing] = useState(false);

  useEffect(() => {
    setPosition(ORIGIN);
    setSpeaking(false);
    setPouncing(false);
  }, []);

  function sayMeow() {
    setSpeaking(true);
    setPouncing(true);
    window.setTimeout(() => setSpeaking(false), 1050);
    window.setTimeout(() => setPouncing(false), 620);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('喵');
      utterance.lang = 'zh-CN';
      utterance.rate = 1.22;
      utterance.pitch = 1.45;
      window.speechSynthesis.speak(utterance);
    }
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    dragStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: position.x,
      y: position.y,
      moved: false,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!dragging) return;
    const start = dragStartRef.current;
    const dx = event.clientX - start.pointerX;
    const dy = event.clientY - start.pointerY;
    if (Math.abs(dx) + Math.abs(dy) > 5) start.moved = true;
    setPosition({
      x: clamp(start.x + dx, -148, 148),
      y: clamp(start.y + dy, -48, 126),
    });
  }

  function onPointerUp(event: PointerEvent<HTMLButtonElement>) {
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (!dragStartRef.current.moved) sayMeow();
  }

  return (
    <button
      type="button"
      ref={catRef}
      className={`interactive-cat${dragging ? ' is-dragging' : ''}${pouncing ? ' is-pouncing' : ''}`}
      style={{ '--cat-x': `${position.x}px`, '--cat-y': `${position.y}px` } as CSSProperties}
      aria-label="小猫助手，点击会回应，拖动可以移动"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDragging(false)}
    >
      {speaking ? <span className="interactive-cat__bubble">喵～</span> : null}
      <img src="/assets/golden-cat-stretch.png" alt="" draggable={false} />
    </button>
  );
}
