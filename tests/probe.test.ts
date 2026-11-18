// tests/probe.test.ts
import { describe, expect, it } from 'vitest';
import { probeAt } from '../src/chart/probe';
import { makeViewport } from '../src/chart/viewport';

describe('probeAt', () => {
  it('inverts pixel position to a full air state', () => {
    const vp = makeViewport();
    const s = probeAt(vp, 200, 150, 400, 300, 101.325);
    // center of full-envelope view: t = 22.5 °C, w = 0.0165
    expect(s.tdb).toBeCloseTo(22.5, 6);
    expect(s.w).toBeCloseTo(0.0165, 8);
    expect(s.rh).toBeGreaterThan(0);
  });
  it('clamps negative humidity ratios to zero at the bottom edge', () => {
    const vp = makeViewport();
    const s = probeAt(vp, 10, 299, 400, 300, 101.325);
    expect(s.w).toBeGreaterThanOrEqual(0);
  });
});
