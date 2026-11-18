// src/math/air.ts
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
