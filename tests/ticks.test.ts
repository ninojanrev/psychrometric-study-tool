// tests/ticks.test.ts
import { describe, expect, it } from 'vitest';
import { fmtTick, pickStep } from '../src/chart/ticks';

describe('pickStep', () => {
  it('produces a step whose pixel gap is at least minPx', () => {
    // full temperature envelope on a 348 px plot: labels need ≥ 48 px
    const step = pickStep(65, 348, 48);
    expect((step / 65) * 348).toBeGreaterThanOrEqual(48);
  });
  it('chooses nice 1/2/5 steps', () => {
    expect(pickStep(65, 348, 48)).toBe(10);
    expect(pickStep(65, 748, 48)).toBe(5);
    expect(pickStep(0.033, 670, 30)).toBe(0.002);
    expect(pickStep(0.033, 670, 4)).toBe(0.0002);
  });
  it('never returns zero or a negative step', () => {
    expect(pickStep(65, 1, 48)).toBeGreaterThan(0);
    expect(pickStep(1e-9, 400, 30)).toBeGreaterThan(0);
  });
});

describe('fmtTick', () => {
  it('renders integers without decimals', () => {
    expect(fmtTick(20, 20)).toBe('20');
    expect(fmtTick(-10, 20)).toBe('-10');
  });
  it('renders fractional steps without trailing zeros', () => {
    expect(fmtTick(0.5, 0.5)).toBe('0.5');
    expect(fmtTick(0.004, 0.002)).toBe('0.004');
    expect(fmtTick(0.03, 0.002)).toBe('0.03');
  });
  it('does not trim meaningful zeros inside integers', () => {
    expect(fmtTick(10, 20)).toBe('10');
    expect(fmtTick(100, 20)).toBe('100');
  });
});
