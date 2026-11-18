// tests/air.test.ts
import { describe, expect, it } from 'vitest';
import {
  enthalpy, pvFromW, pws, specificVolume, wFromEnthalpy,
  wFromPv, wFromRh, wFromVolume,
} from '../src/math/air';

describe('pws (Hyland–Wexler)', () => {
  it('matches ASHRAE table values', () => {
    expect(pws(-10)).toBeCloseTo(0.2602, 3);   // ice branch
    expect(pws(0)).toBeCloseTo(0.6112, 3);     // ice/water boundary
    expect(pws(25)).toBeCloseTo(3.1698, 2);
    expect(pws(55)).toBeCloseTo(15.758, 1);
  });
});

describe('humidity ratio round trips', () => {
  it('wFromPv / pvFromW invert', () => {
    const w = wFromPv(1.5849, 101.325);
    expect(w).toBeCloseTo(0.009883, 6);
    expect(pvFromW(w, 101.325)).toBeCloseTo(1.5849, 6);
  });
  it('wFromRh at 25 °C / 50 % sea level matches Carrier chart 0.00988', () => {
    expect(wFromRh(25, 0.5, 101.325)).toBeCloseTo(0.009882, 5);
  });
});

describe('enthalpy and volume', () => {
  it('h at 25 °C / W 0.009882 ≈ 50.3 kJ/kg (chart)', () => {
    expect(enthalpy(25, 0.009882)).toBeCloseTo(50.33, 1);
  });
  it('v at 25 °C / W 0.009882 ≈ 0.858 m³/kg (chart ±0.5 %)', () => {
    const v = specificVolume(25, 0.009882, 101.325);
    expect(v).toBeGreaterThan(0.855);
    expect(v).toBeLessThan(0.861);
  });
  it('wFromEnthalpy inverts enthalpy', () => {
    const h = enthalpy(25, 0.009882);
    expect(wFromEnthalpy(25, h)).toBeCloseTo(0.009882, 8);
  });
  it('wFromVolume inverts specificVolume', () => {
    const v = specificVolume(25, 0.009882, 101.325);
    expect(wFromVolume(25, v, 101.325)).toBeCloseTo(0.009882, 8);
  });
});
