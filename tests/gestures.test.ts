// tests/gestures.test.ts
import { describe, expect, it, vi } from 'vitest';
import { attachGestures } from '../src/chart/engine';
import { makeViewport } from '../src/chart/viewport';

function fire(el: EventTarget, type: string, props: Record<string, unknown>) {
  const e = new Event(type, { bubbles: true });
  Object.assign(e, props);
  el.dispatchEvent(e);
}

describe('attachGestures', () => {
  it('fires onTap on a quick tap and supports double-tap reset', () => {
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, 400, 300),
    );
    const handlers = {
      getViewport: () => makeViewport(),
      setViewport: vi.fn(),
      onTap: vi.fn(),
      onDoubleTap: vi.fn(),
      onLongPress: vi.fn(),
    };
    const detach = attachGestures(canvas, handlers);

    fire(canvas, 'pointerdown', { pointerId: 1, clientX: 120, clientY: 80 });
    fire(canvas, 'pointerup', { pointerId: 1, clientX: 120, clientY: 80 });
    expect(handlers.onTap).toHaveBeenCalledWith(120, 80);

    // second tap within 300 ms and <30 px away is a double-tap, not a second tap
    // (real timers used; the two taps run back-to-back inside the 300 ms window)
    fire(canvas, 'pointerdown', { pointerId: 1, clientX: 121, clientY: 81 });
    fire(canvas, 'pointerup', { pointerId: 1, clientX: 121, clientY: 81 });
    expect(handlers.onTap).toHaveBeenCalledTimes(1);
    expect(handlers.onDoubleTap).toHaveBeenCalledTimes(1);
    detach();
  });

  it('fires onLongPress after 600 ms hold without movement', () => {
    vi.useFakeTimers();
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, 400, 300),
    );
    const handlers = {
      getViewport: () => makeViewport(),
      setViewport: vi.fn(),
      onTap: vi.fn(),
      onDoubleTap: vi.fn(),
      onLongPress: vi.fn(),
    };
    const detach = attachGestures(canvas, handlers);
    fire(canvas, 'pointerdown', { pointerId: 1, clientX: 30, clientY: 40 });
    vi.advanceTimersByTime(650);
    expect(handlers.onLongPress).toHaveBeenCalledWith(30, 40);
    vi.useRealTimers();
    detach();
  });
});
