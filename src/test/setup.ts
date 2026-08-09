import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => cleanup());

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  if (!window.PointerEvent) {
    class TestPointerEvent extends MouseEvent {
      pointerId: number;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 0;
      }
    }
    Object.defineProperty(window, 'PointerEvent', { configurable: true, value: TestPointerEvent });
    Object.defineProperty(globalThis, 'PointerEvent', { configurable: true, value: TestPointerEvent });
  }
  Object.defineProperty(window, 'scrollTo', { configurable: true, value: vi.fn() });
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', { configurable: true, value: vi.fn() });
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', { configurable: true, value: vi.fn() });
  Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', { configurable: true, value: vi.fn(() => true) });
  class TestDomMatrix {
    m42 = 0;
    constructor(transform?: string) {
      const matrix = transform?.match(/matrix(?:3d)?\(([^)]+)\)/)?.[1]?.split(',').map(Number);
      if (matrix) this.m42 = matrix.length === 16 ? matrix[13] ?? 0 : matrix[5] ?? 0;
    }
  }
  Object.defineProperty(globalThis, 'DOMMatrixReadOnly', { configurable: true, value: TestDomMatrix });
}
