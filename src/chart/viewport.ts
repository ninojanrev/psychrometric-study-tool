// src/chart/viewport.ts
import { ENVELOPE } from './envelope';

export { ENVELOPE };

export interface Viewport { tmin: number; tmax: number; wmin: number; wmax: number; }

// Gutters the chart never draws into, so axis labels sit clear of the
// screen edge. All pixel↔chart mapping is relative to this rect.
export const PLOT_PAD = { left: 44, right: 8, top: 8, bottom: 22 } as const;

export function plotRect(width: number, height: number) {
  return {
    x: PLOT_PAD.left,
    y: PLOT_PAD.top,
    w: Math.max(1, width - PLOT_PAD.left - PLOT_PAD.right),
    h: Math.max(1, height - PLOT_PAD.top - PLOT_PAD.bottom),
  };
}

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
  const r = plotRect(width, height);
  return {
    t: vp.tmin + ((x - r.x) / r.w) * (vp.tmax - vp.tmin),
    w: vp.wmax - ((y - r.y) / r.h) * (vp.wmax - vp.wmin),
  };
}

export function chartToPixel(vp: Viewport, t: number, w: number, width: number, height: number) {
  const r = plotRect(width, height);
  return {
    x: r.x + ((t - vp.tmin) / (vp.tmax - vp.tmin)) * r.w,
    y: r.y + ((vp.wmax - w) / (vp.wmax - vp.wmin)) * r.h,
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

export function centerOn(vp: Viewport, t: number, w: number): Viewport {
  const tSpan = vp.tmax - vp.tmin;
  const wSpan = vp.wmax - vp.wmin;
  return clamp({
    tmin: t - tSpan / 2, tmax: t + tSpan / 2,
    wmin: w - wSpan / 2, wmax: w + wSpan / 2,
  });
}
