// src/chart/engine.ts
import { panBy, zoomAt } from './viewport';
import type { Viewport } from './viewport';

export interface GestureHandlers {
  getViewport(): Viewport;
  setViewport(vp: Viewport): void;
  onTap(x: number, y: number): void;
  onDoubleTap(): void;
  onLongPress(x: number, y: number): void;
}

const DOUBLE_TAP_MS = 300;
const LONG_PRESS_MS = 600;
const MOVE_SLOP_PX = 10;

export function attachGestures(canvas: HTMLCanvasElement, h: GestureHandlers): () => void {
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchDist = 0;
  let downAt = 0;
  let downX = 0, downY = 0;
  let moved = false;
  let longTimer: number | undefined;
  let lastTapAt = 0;
  let lastTapX = 0, lastTapY = 0;

  const rel = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const panByPixels = (dx: number, dy: number) => {
    const vp = h.getViewport();
    const w = canvas.clientWidth || 1;
    const ht = canvas.clientHeight || 1;
    h.setViewport(panBy(vp, (-dx * (vp.tmax - vp.tmin)) / w, (dy * (vp.wmax - vp.wmin)) / ht));
  };

  const zoomBy = (factor: number, cx: number, cy: number) => {
    const vp = h.getViewport();
    h.setViewport(zoomAt(vp, factor, cx, cy, canvas.clientWidth || 1, canvas.clientHeight || 1));
  };

  const onPointerDown = (e: PointerEvent) => {
    canvas.setPointerCapture?.(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      const p = rel(e);
      downAt = performance.now();
      downX = p.x; downY = p.y;
      moved = false;
      longTimer = window.setTimeout(() => {
        if (!moved) { moved = true; h.onLongPress(downX, downY); }
      }, LONG_PRESS_MS);
    } else if (pointers.size === 2) {
      window.clearTimeout(longTimer);
      moved = true;
      const [p1, p2] = [...pointers.values()];
      pinchDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      const p = rel(e);
      if (!moved && (Math.abs(p.x - downX) > MOVE_SLOP_PX || Math.abs(p.y - downY) > MOVE_SLOP_PX)) {
        moved = true;
        window.clearTimeout(longTimer);
      }
      if (moved) panByPixels(e.clientX - prev.x, e.clientY - prev.y);
    } else if (pointers.size === 2) {
      const [p1, p2] = [...pointers.values()];
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (pinchDist > 0) {
        const r = canvas.getBoundingClientRect();
        zoomBy(1 / (dist / pinchDist), (p1.x + p2.x) / 2 - r.left, (p1.y + p2.y) / 2 - r.top);
      }
      pinchDist = dist;
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    window.clearTimeout(longTimer);
    const had = pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchDist = 0;
    if (!had || moved) return;
    const quick = performance.now() - downAt < DOUBLE_TAP_MS + 100;
    if (!quick) return;
    const p = rel(e);
    const now = performance.now();
    if (now - lastTapAt < DOUBLE_TAP_MS && Math.hypot(p.x - lastTapX, p.y - lastTapY) < 30) {
      lastTapAt = 0;
      h.onDoubleTap();
    } else {
      lastTapAt = now;
      lastTapX = p.x; lastTapY = p.y;
      h.onTap(p.x, p.y);
    }
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    zoomBy(e.deltaY < 0 ? 0.9 : 1.1, e.clientX - r.left, e.clientY - r.top);
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.style.touchAction = 'none';

  return () => {
    window.clearTimeout(longTimer);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
    canvas.removeEventListener('wheel', onWheel);
  };
}
