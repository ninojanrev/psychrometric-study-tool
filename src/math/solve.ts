// src/math/solve.ts
import {
  airState, dewPointFromPv, enthalpy, pws, pvFromW, specificVolume,
  wFromEnthalpy, wFromPv, wFromRh, wFromVolume, wFromWetBulb,
} from './air';
import type { AirState, PropertyName } from './types';

export const CHART_TMIN = -10;
export const CHART_TMAX = 55;
export const FEASIBLE_RH_MAX = 1.0005;

export class SolveError extends Error {
  // Note: declared as an explicit field + assignment (not a constructor parameter
  // property) because this project compiles with erasableSyntaxOnly, which forbids
  // parameter properties.
  code: 'infeasible' | 'degenerate' | 'no-convergence';
  constructor(code: 'infeasible' | 'degenerate' | 'no-convergence', message: string) {
    super(message);
    this.code = code;
    this.name = 'SolveError';
  }
}

const R_DA = 287.055;

function requireFinite(...vals: number[]): void {
  if (vals.some((v) => !Number.isFinite(v))) {
    throw new SolveError('infeasible', 'Please enter valid numbers for both values.');
  }
}

function bisectResidual(f: (tdb: number) => number, lo: number, hi: number): number {
  let a = lo, b = hi;
  // Note: fa must be `let` (the loop reassigns it to keep fa = f(a) in sync);
  // the brief's `const` was a compile error under strict TypeScript.
  let fa = f(a), fb = f(b);
  if (Number.isNaN(fa) || Number.isNaN(fb) || fa > 0 === fb > 0) {
    throw new SolveError('no-convergence', 'These two values don\'t describe a possible air state — check your inputs.');
  }
  for (let i = 0; i < 100; i++) {
    const m = (a + b) / 2;
    const fm = f(m);
    if (fm === 0 || (b - a) < 1e-10) return m;
    if (fa * fm < 0) { b = m; } else { a = m; fa = fm; }
  }
  return (a + b) / 2;
}

function tdbFromVolume(v: number, w: number, p: number): number {
  return (v * 1000 * p) / (R_DA * (1 + 1.607858 * w)) - 273.15;
}

function wFromOther(tdb: number, other: PropertyName, ov: number, p: number): number {
  switch (other) {
    case 'rh': return wFromRh(tdb, ov, p);
    case 'twb': return wFromWetBulb(tdb, ov, p);
    case 'tdp': return wFromPv(pws(ov), p);
    case 'w': return ov;
    case 'h': return wFromEnthalpy(tdb, ov);
    case 'v': return wFromVolume(tdb, ov, p);
    default: throw new Error('unreachable');
  }
}

// Returns [tdb, w] for the known pair at pressure p.
// 13 closed-form pairs, 1 degenerate, 7 bisection pairs (all residuals monotone in tdb).
function solveTW(a: PropertyName, va: number, b: PropertyName, vb: number, p: number): [number, number] {
  const has = (n: PropertyName) => a === n || b === n;
  const val = (n: PropertyName) => (a === n ? va : vb);

  if (has('tdb')) {
    const tdb = val('tdb');
    const other = (['twb', 'tdp', 'rh', 'w', 'h', 'v'] as PropertyName[]).find((n) => has(n))!;
    return [tdb, wFromOther(tdb, other, val(other), p)];
  }
  // (twb, w): ASHRAE eq. 33 rearranged is linear in tdb
  if (has('twb') && has('w')) {
    const twb = val('twb'), w = val('w');
    const k1 = (2501 - 2.326 * twb) * wFromPv(pws(twb), p);
    const tdb = (k1 + 1.006 * twb + 4.186 * twb * w - 2501 * w) / (1.006 + 1.86 * w);
    return [tdb, w];
  }
  // (rh, w): vapor pressure fixes tdb via inverted pws
  if (has('rh') && has('w')) {
    const rh = val('rh'), w = val('w');
    const pv = pvFromW(w, p);
    return [dewPointFromPv(pv / rh), w];
  }
  // (rh, tdp): pv = pws(tdp) (air is saturated at its dew point), and
  // rh = pv / pws(tdb) → tdb = dewPointFromPv(pv / rh).
  // (Matches psychrolib GetRelHumFromTDewPoint; the brief's rh·pws(tdp) was inverted.)
  if (has('rh') && has('tdp')) {
    const rh = val('rh'), tdp = val('tdp');
    const pv = pws(tdp);
    return [dewPointFromPv(pv / rh), wFromPv(pv, p)];
  }
  // (tdp, h): W known from tdp, tdb backs out of enthalpy
  if (has('tdp') && has('h')) {
    const tdp = val('tdp'), h = val('h');
    const w = wFromPv(pws(tdp), p);
    return [(h - 2501 * w) / (1.006 + 1.86 * w), w];
  }
  // (tdp, v)
  if (has('tdp') && has('v')) {
    const tdp = val('tdp'), v = val('v');
    const w = wFromPv(pws(tdp), p);
    return [tdbFromVolume(v, w, p), w];
  }
  // (w, h)
  if (has('w') && has('h')) {
    const w = val('w'), h = val('h');
    return [(h - 2501 * w) / (1.006 + 1.86 * w), w];
  }
  // (w, v)
  if (has('w') && has('v')) {
    const w = val('w'), v = val('v');
    return [tdbFromVolume(v, w, p), w];
  }
  // (tdp, w): degenerate — both only constrain vapor pressure
  if (has('tdp') && has('w')) {
    const tdp = val('tdp'), w = val('w');
    const pvTdp = pws(tdp);
    const pvW = (p * w) / (0.621945 + w);
    if (Math.abs(pvTdp - pvW) / pvTdp > 0.01) {
      throw new SolveError('infeasible', 'Dew point and humidity ratio don\'t agree at this pressure — check your values.');
    }
    throw new SolveError('degenerate', 'Dew point and humidity ratio alone don\'t determine the air state — pick two different properties.');
  }

  // Remaining 7 pairs: (twb,tdp) (twb,rh) (twb,h) (twb,v) (rh,h) (rh,v) (h,v)
  const known = (n: PropertyName) => (a === n ? va : vb);
  const tdb = bisectResidual((t) => {
    if (has('twb') && has('tdp')) { const w = wFromWetBulb(t, known('twb'), p); return pvFromW(w, p) - pws(known('tdp')); }
    if (has('twb') && has('rh')) { const w = wFromWetBulb(t, known('twb'), p); return pvFromW(w, p) / pws(t) - known('rh'); }
    if (has('twb') && has('h')) { const w = wFromWetBulb(t, known('twb'), p); return enthalpy(t, w) - known('h'); }
    if (has('twb') && has('v')) { const w = wFromWetBulb(t, known('twb'), p); return specificVolume(t, w, p) - known('v'); }
    if (has('rh') && has('h')) { const w = wFromEnthalpy(t, known('h')); return pvFromW(w, p) / pws(t) - known('rh'); }
    if (has('rh') && has('v')) { const w = wFromVolume(t, known('v'), p); return pvFromW(w, p) / pws(t) - known('rh'); }
    const w = wFromEnthalpy(t, known('h'));
    return specificVolume(t, w, p) - known('v');
  }, CHART_TMIN, CHART_TMAX);
  // Recover w at the solved tdb from the property that drives it
  const w = has('twb') ? wFromWetBulb(tdb, known('twb'), p)
    : has('h') ? wFromEnthalpy(tdb, known('h'))
    : wFromVolume(tdb, known('v'), p);
  return [tdb, w];
}

export function solveState(a: PropertyName, va: number, b: PropertyName, vb: number, p: number): AirState {
  requireFinite(va, vb, p);
  if (p <= 0) throw new SolveError('infeasible', 'Pressure must be positive.');
  const [tdb, w] = solveTW(a, va, b, vb, p);
  const state = airState(tdb, w, p);
  if (state.rh > FEASIBLE_RH_MAX) {
    throw new SolveError('infeasible', 'This combination holds more moisture than the air can — relative humidity exceeds 100 %. Check your values.');
  }
  if (state.tdp > state.tdb + 0.01) {
    throw new SolveError('infeasible', 'Dew point can\'t be above dry-bulb temperature — check your values.');
  }
  if (state.w < -1e-9 || state.tdb < -60 || state.tdb > 120) {
    throw new SolveError('infeasible', 'These values are outside the range of moist air — check your inputs.');
  }
  return state;
}
