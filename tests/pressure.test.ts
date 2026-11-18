// tests/pressure.test.ts
import { describe, expect, it } from 'vitest';
import { P_SEA_LEVEL, pressureAtAltitude } from '../src/math/pressure';

describe('pressureAtAltitude', () => {
  it('returns sea level pressure at 0 m', () => {
    expect(pressureAtAltitude(0)).toBeCloseTo(101.325, 2);
  });
  it('returns 84.556 kPa at 1500 m (standard atmosphere)', () => {
    expect(pressureAtAltitude(1500)).toBeCloseTo(84.556, 1);
  });
  it('returns 70.107 kPa at 3000 m (standard atmosphere)', () => {
    expect(pressureAtAltitude(3000)).toBeCloseTo(70.107, 1);
  });
  it('clamps altitude to [-500, 10000] m', () => {
    expect(pressureAtAltitude(-1000)).toBeCloseTo(pressureAtAltitude(-500), 3);
    expect(pressureAtAltitude(20000)).toBeCloseTo(pressureAtAltitude(10000), 3);
  });
  it('exports sea level constant in kPa', () => {
    expect(P_SEA_LEVEL).toBe(101.325);
  });
});
