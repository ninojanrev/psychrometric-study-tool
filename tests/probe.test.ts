// tests/probe.test.ts
import { describe, expect, it } from 'vitest';
import { probeAt } from '../src/chart/probe';
import { makeViewport } from '../src/chart/viewport';

describe('probeAt', () => {
  it('inverts pixel position to a full air state', () => {
    const vp = makeViewport();
    const s = probeAt(vp, 200, 150, 400, 300, 101.325);
    // pixel (200,150) inside a 348×270 plot offset by PLOT_PAD:
    // t = -10 + (200-44)/348 × 65 ≈ 19.1379, w = 0.033 × (1-(150-8)/270) ≈ 0.015644
    expect(s.tdb).toBeCloseTo(19.1379, 3);
    expect(s.w).toBeCloseTo(0.015644, 6);
    expect(s.rh).toBeGreaterThan(0);
  });
  it('clamps negative humidity ratios to zero at the bottom edge', () => {
    const vp = makeViewport();
    const s = probeAt(vp, 10, 299, 400, 300, 101.325);
    expect(s.w).toBeGreaterThanOrEqual(0);
  });
});
