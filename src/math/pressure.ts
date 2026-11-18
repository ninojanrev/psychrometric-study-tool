// src/math/pressure.ts
export const P_SEA_LEVEL = 101.325; // kPa

// Standard-atmosphere troposphere formula, clamped to [-500, 10000] m
export function pressureAtAltitude(altitudeM: number): number {
  const h = Math.max(-500, Math.min(10000, altitudeM));
  return P_SEA_LEVEL * Math.pow(1 - 2.25577e-5 * h, 5.2559);
}
