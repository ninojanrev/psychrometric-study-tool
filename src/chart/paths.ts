// src/chart/paths.ts
import { R_DA, pws, wFromEnthalpy, wFromPv, wFromWetBulb } from '../math/air';
import { ENVELOPE } from './envelope';
import type { Viewport } from './viewport';

export type Pt = [number, number];

// Sample f over the viewport's t-range, keeping points inside the envelope.
// All families are monotone in t, so a line crosses the envelope at most once
// and the kept points form one contiguous run. `tStart` raises the lower
// sampling bound (wetBulbPath uses it to skip the t < twb fog region).
function sample(f: (t: number) => number, vp: Viewport, n: number, capW = ENVELOPE.wmax, tStart = -Infinity): Pt[] {
  const t0 = Math.max(ENVELOPE.tmin, vp.tmin, tStart);
  const t1 = Math.min(ENVELOPE.tmax, vp.tmax);
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n;
    const w = f(t);
    if (Number.isFinite(w) && w >= 0 && w <= capW) pts.push([t, w]);
  }
  return pts;
}

export function saturationPath(vp: Viewport, p: number, n = 200): Pt[] {
  return sample((t) => wFromPv(pws(t), p), vp, n);
}

export function rhPath(rh: number, vp: Viewport, p: number, n = 200): Pt[] {
  return sample((t) => wFromPv(rh * pws(t), p), vp, n);
}

// n = 65 samples the 65 °C envelope span on a 1 °C grid, so enthalpy lines
// land exactly on whole-degree crossings (the brief's interface said n = 2
// and its reference implementation n = 100; neither grid hits t = 25/15).
export function enthalpyPath(hVal: number, vp: Viewport, n = 65): Pt[] {
  return sample((t) => wFromEnthalpy(t, hVal), vp, n);
}

// Sampling starts at twb, not the viewport's left edge: wet-bulb lines exist
// only for tdb ≥ twb — below twb the closed-form ASHRAE eq. 33 returns finite
// supersaturated (fog) values. Starting at twb also makes the first point the
// saturation anchor (twb, Ws(twb)).
export function wetBulbPath(twb: number, vp: Viewport, p: number, n = 200): Pt[] {
  return sample((t) => wFromWetBulb(t, twb, p), vp, n, ENVELOPE.wmax, twb);
}

export function volumePath(vVal: number, vp: Viewport, p: number, n = 200): Pt[] {
  return sample((t) => ((vVal * 1000 * p) / (R_DA * (t + 273.15)) - 1) / 1.607858, vp, n);
}

// Splits a continuous point list into sub-paths of consecutive in-viewport
// points, for drawing with viewport clipping.
export function clipSegmentsToViewport(pts: Pt[], vp: Viewport): Pt[][] {
  const out: Pt[][] = [];
  let cur: Pt[] = [];
  for (const [t, w] of pts) {
    const inside = t >= vp.tmin && t <= vp.tmax && w >= vp.wmin && w <= vp.wmax;
    if (inside) cur.push([t, w]);
    else if (cur.length > 0) { out.push(cur); cur = []; }
  }
  if (cur.length > 1 || (cur.length === 1 && out.length === 0)) out.push(cur);
  return out;
}
