// src/chart/viewport.ts
import { ENVELOPE } from './envelope';

export { ENVELOPE };

export interface Viewport { tmin: number; tmax: number; wmin: number; wmax: number; }

export function makeViewport(): Viewport {
  return { ...ENVELOPE };
}

const MIN_SPAN_T = (ENVELOPE.tmax - ENVELOPE.tmin) / 600; // 600× max zoom
const MARGIN_T = 0.1 * (ENVELOPE.tmax - ENVELOPE.tmin);
const MARGIN_W = 0.1 * ENVELOPE.wmax;

function clamp(vp: Viewport): Viewport {
  const tSpan = vp.tmax - vp.tmin;
  const wSpan = vp.wmax - vp.wmin;
  let tmin = vp.tmin, wmin = vp.wmin;
  tmin = Math.max(ENVELOPE.tmin - MARGIN_T, Math.min(tmin, ENVELOPE.tmax + MARGIN_T - tSpan));
  wmin = Math.max(ENVELOPE.wmin - MARGIN_W, Math.min(wmin, ENVELOPE.wmax + MARGIN_W - wSpan));
  return { tmin, tmax: tmin + tSpan, wmin, wmax: wmin + wSpan };
}

export function pixelToChart(vp: Viewport, x: number, y: number, width: number, height: number) {
  return {
    t: vp.tmin + (x / width) * (vp.tmax - vp.tmin),
    w: vp.wmax - (y / height) * (vp.wmax - vp.wmin),
  };
}

export function chartToPixel(vp: Viewport, t: number, w: number, width: number, height: number) {
  return {
    x: ((t - vp.tmin) / (vp.tmax - vp.tmin)) * width,
    y: ((vp.wmax - w) / (vp.wmax - vp.wmin)) * height,
  };
}

export function zoomAt(vp: Viewport, factor: number, px: number, py: number, width: number, height: number): Viewport {
  const focus = pixelToChart(vp, px, py, width, height);
  // Zoom window clamped to 1× (full envelope span) … 600× of envelope.
  const tSpan = Math.min(ENVELOPE.tmax - ENVELOPE.tmin, Math.max(MIN_SPAN_T, (vp.tmax - vp.tmin) * factor));
  const wSpan = Math.min(ENVELOPE.wmax - ENVELOPE.wmin, Math.max(MIN_SPAN_T * (ENVELOPE.wmax / (ENVELOPE.tmax - ENVELOPE.tmin)), (vp.wmax - vp.wmin) * factor));
  const tRat = (focus.t - vp.tmin) / (vp.tmax - vp.tmin);
  const wRat = (focus.w - vp.wmin) / (vp.wmax - vp.wmin);
  return clamp({
    tmin: focus.t - tRat * tSpan,
    tmax: focus.t + (1 - tRat) * tSpan,
    wmin: focus.w - wRat * wSpan,
    wmax: focus.w + (1 - wRat) * wSpan,
  });
}

export function panBy(vp: Viewport, dt: number, dw: number): Viewport {
  return clamp({
    tmin: vp.tmin + dt, tmax: vp.tmax + dt,
    wmin: vp.wmin + dw, wmax: vp.wmax + dw,
  });
}
