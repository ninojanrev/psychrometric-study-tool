// tests/paths.test.ts
import { describe, expect, it } from 'vitest';
import { ENVELOPE } from '../src/chart/envelope';
import { makeViewport } from '../src/chart/viewport';
import { enthalpyPath, rhPath, saturationPath, volumePath, wetBulbPath } from '../src/chart/paths';

const vp = makeViewport();
const P = 101.325;

describe('saturationPath', () => {
  it('starts on the left edge at Ws(-10) and exits the top near 34 °C', () => {
    const pts = saturationPath(vp, P);
    expect(pts[0][0]).toBeCloseTo(ENVELOPE.tmin, 6);
    expect(pts[0][1]).toBeCloseTo(0.00160, 4); // Ws(-10 °C) ice branch
    const last = pts[pts.length - 1];
    expect(last[1]).toBeCloseTo(ENVELOPE.wmax, 3);
    expect(last[0]).toBeGreaterThan(32);
    expect(last[0]).toBeLessThan(36);
  });
  it('is monotonic in t and w', () => {
    const pts = saturationPath(vp, P);
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i][0]).toBeGreaterThanOrEqual(pts[i - 1][0]);
      expect(pts[i][1]).toBeGreaterThanOrEqual(pts[i - 1][1]);
    }
  });
});

describe('rhPath', () => {
  it('50 % RH line lies below saturation everywhere', () => {
    const sat = saturationPath(vp, P);
    const line = rhPath(0.5, vp, P);
    const satAt = (t: number) => {
      let best = sat[0];
      for (const pt of sat) if (Math.abs(pt[0] - t) < Math.abs(best[0] - t)) best = pt;
      return best[1];
    };
    for (const [t, w] of line) {
      if (t < 33) expect(w).toBeLessThan(satAt(t));
    }
  });
});

describe('enthalpyPath', () => {
  it('h = 50 kJ/kg crosses (25 °C, ~0.0098) and (15 °C, ~0.0133)', () => {
    const pts = enthalpyPath(50, vp);
    const at = (t: number) => pts.find((pt) => Math.abs(pt[0] - t) < 0.01);
    expect(at(25)?.[1]).toBeCloseTo((50 - 1.006 * 25) / (2501 + 1.86 * 25), 4);
    expect(at(15)?.[1]).toBeCloseTo((50 - 1.006 * 15) / (2501 + 1.86 * 15), 4);
  });
});

describe('wetBulbPath', () => {
  it('twb = 10 °C passes through its saturation point (10 °C, Ws(10))', () => {
    const pts = wetBulbPath(10, vp, P);
    const near = pts.find((pt) => Math.abs(pt[0] - 10) < 0.05);
    expect(near).toBeDefined();
    expect(near![1]).toBeCloseTo(0.00766, 3); // Ws(10 °C)
  });
});

describe('volumePath', () => {
  it('v = 0.86 passes near (25 °C, 0.0099)', () => {
    const pts = volumePath(0.86, vp, P);
    const near = pts.find((pt) => Math.abs(pt[0] - 25) < 0.5);
    expect(near).toBeDefined();
    expect(near![1]).toBeCloseTo(0.0100, 2);
  });
});
