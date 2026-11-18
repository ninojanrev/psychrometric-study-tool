// src/math/air.ts
import type { AirState } from './types';

export const R_DA = 287.055;  // J/(kg·K) dry air
export const R_V = 461.495;   // J/(kg·K) water vapor
export const W_RATIO = 0.621945; // R_DA / R_V

// Hyland–Wexler saturation vapor pressure (ASHRAE Fundamentals ch. 1).
// T in °C, result in kPa. Water branch above 0 °C, ice branch at/below.
export function pws(tC: number): number {
  const T = tC + 273.15;
  let lnP: number;
  if (T > 273.15) {
    lnP = -5800.2206 / T + 1.3914993 - 0.048640239 * T + 4.1764768e-5 * T * T
        - 1.4452093e-8 * T * T * T + 6.5459673 * Math.log(T);
  } else {
    lnP = -5674.5359 / T + 6.3925247 - 0.009677843 * T + 6.2215701e-7 * T * T
        + 2.0747825e-9 * T * T * T - 9.484024e-13 * T * T * T * T
        + 4.1635019 * Math.log(T);
  }
  return Math.exp(lnP) / 1000; // Pa → kPa
}

export function wFromPv(pv: number, p: number): number {
  return (W_RATIO * pv) / (p - pv);
}

export function pvFromW(w: number, p: number): number {
  return (p * w) / (W_RATIO + w);
}

export function wFromRh(tdb: number, rh: number, p: number): number {
  return wFromPv(rh * pws(tdb), p);
}

export function enthalpy(tdb: number, w: number): number {
  return 1.006 * tdb + w * (2501 + 1.86 * tdb);
}

export function specificVolume(tdb: number, w: number, p: number): number {
  return (R_DA * (tdb + 273.15) * (1 + 1.607858 * w)) / (1000 * p);
}

export function wFromEnthalpy(tdb: number, h: number): number {
  return (h - 1.006 * tdb) / (2501 + 1.86 * tdb);
}

export function wFromVolume(tdb: number, v: number, p: number): number {
  return ((v * 1000 * p) / (R_DA * (tdb + 273.15)) - 1) / 1.607858;
}

// ASHRAE Fundamentals eq. 33: thermodynamic wet-bulb relation
export function wFromWetBulb(tdb: number, twb: number, p: number): number {
  const wsTwb = wFromPv(pws(twb), p);
  return ((2501 - 2.326 * twb) * wsTwb - 1.006 * (tdb - twb))
       / (2501 + 1.86 * tdb - 4.186 * twb);
}

// Generic monotonic bisection: find x in [lo, hi] with f(x) ≈ 0
function bisect(f: (x: number) => number, lo: number, hi: number): number {
  let a = lo, b = hi;
  let fa = f(a);
  for (let i = 0; i < 100; i++) {
    const m = (a + b) / 2;
    const fm = f(m);
    if (fm === 0 || (b - a) < 1e-10) return m;
    if (fa * fm < 0) { b = m; } else { a = m; fa = fm; }
  }
  return (a + b) / 2;
}

export function wetBulbFromTW(tdb: number, w: number, p: number): number {
  // wFromWetBulb is strictly increasing in twb on [-60, tdb]
  return bisect((twb) => wFromWetBulb(tdb, twb, p) - w, -60, tdb);
}

export function dewPointFromPv(pv: number): number {
  // pws(T) is strictly increasing on [-60, 200]
  return bisect((t) => pws(t) - pv, -60, 200);
}

// ASHRAE Fundamentals ch. 1: degree of saturation mu = W / Ws at dry-bulb temperature
export function degreeOfSaturation(tdb: number, w: number, p: number): number {
  return w / wFromPv(pws(tdb), p);
}

export function airState(tdb: number, w: number, p: number): AirState {
  const pv = pvFromW(w, p);
  const twb = wetBulbFromTW(tdb, w, p);
  return {
    p, tdb, w,
    rh: pv / pws(tdb),
    twb,
    tdp: dewPointFromPv(pv),
    h: enthalpy(tdb, w),
    v: specificVolume(tdb, w, p),
    pv,
    pws: pws(tdb),
    mu: degreeOfSaturation(tdb, w, p),
  };
}
