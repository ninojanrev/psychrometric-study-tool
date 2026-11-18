// tests/air-iterative.test.ts
import { describe, expect, it } from 'vitest';
import { airState, dewPointFromPv, pws, wetBulbFromTW, wFromWetBulb } from '../src/math/air';

describe('wet-bulb', () => {
  it('returns tdb for saturated air', () => {
    const tdb = 30;
    const w = wFromWetBulb(tdb, tdb, 101.325); // twb = tdb → saturation
    expect(wetBulbFromTW(tdb, w, 101.325)).toBeCloseTo(30, 4);
  });
  it('matches reference wet-bulb 17.9 °C at 25 °C / W 0.009882', () => {
    // psychrolib GetTWetBulbFromHumRatio(25, 0.009882, 101325) = 17.8904
    expect(wetBulbFromTW(25, 0.009882, 101.325)).toBeCloseTo(17.89, 1);
  });
});

describe('dew point', () => {
  it('inverts pws exactly', () => {
    expect(dewPointFromPv(pws(25))).toBeCloseTo(25, 4);
  });
  it('matches chart value 13.9 °C at 25 °C / W 0.009882', () => {
    expect(dewPointFromPv(1.5849)).toBeCloseTo(13.86, 1);
  });
  it('uses ice branch below 0 °C', () => {
    expect(dewPointFromPv(pws(-10))).toBeCloseTo(-10, 4);
  });
});

describe('airState assembly', () => {
  const s = airState(25, 0.009882, 101.325);
  it('fills every property', () => {
    expect(s.rh).toBeCloseTo(0.5, 3);
    expect(s.h).toBeCloseTo(50.33, 1);
    expect(s.twb).toBeCloseTo(17.89, 1); // psychrolib reference: 17.8904
    expect(s.tdp).toBeCloseTo(13.86, 1);
    expect(s.pws).toBeCloseTo(3.1698, 2);
    expect(s.mu).toBeGreaterThan(0);
    expect(s.mu).toBeLessThanOrEqual(1);
    // mu = W / Ws at dry-bulb (ASHRAE ch. 1): 0.4921 for 25 °C / W 0.009882 / 101.325 kPa
    expect(s.mu).toBeCloseTo(0.4921, 4);
    // Identity RH = mu / (1 - (1-mu) * pws/p) holds only for the tdb definition
    const pvSat = pws(s.tdb);
    const muIdentity = s.mu / (1 - (1 - s.mu) * pvSat / s.p);
    expect(muIdentity).toBeCloseTo(s.rh, 3);
  });
});
