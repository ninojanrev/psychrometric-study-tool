// tests/solve.test.ts
import { describe, expect, it } from 'vitest';
import psychrolib from 'psychrolib';
import { SolveError, solveState } from '../src/math/solve';
import { airState, enthalpy, specificVolume, wFromRh } from '../src/math/air';
import { pressureAtAltitude } from '../src/math/pressure';
import type { PropertyName } from '../src/math/types';

const PROPS: PropertyName[] = ['tdb', 'twb', 'tdp', 'rh', 'w', 'h', 'v'];
const ALTITUDES = [0, 1500, 3000];
const REFERENCES = [
  { tdb: 25, rh: 0.5 }, { tdb: 5, rh: 0.8 }, { tdb: 40, rh: 0.3 }, { tdb: -5, rh: 0.6 },
];

describe('solveState round trips over all 21 pairs', () => {
  for (const ref of REFERENCES) {
    for (const alt of ALTITUDES) {
      const p = pressureAtAltitude(alt);
      const refState = airState(ref.tdb, wFromRh(ref.tdb, ref.rh, p), p);
      const label = `${ref.tdb}°C/${ref.rh * 100}%@${alt}m`;

      for (let i = 0; i < PROPS.length; i++) {
        for (let j = i + 1; j < PROPS.length; j++) {
          const [a, b] = [PROPS[i], PROPS[j]];
          if (a === 'tdp' && b === 'w') continue; // degenerate pair, tested separately

          it(`pair (${a},${b}) at ${label} reproduces the reference state`, () => {
            const solved = solveState(a, refState[a], b, refState[b], p);
            expect(solved.tdb).toBeCloseTo(refState.tdb, 1);
            expect(solved.w).toBeCloseTo(refState.w, 5);
            expect(solved.twb).toBeCloseTo(refState.twb, 1);
            expect(solved.h).toBeCloseTo(refState.h, 1);
          });
        }
      }
    }
  }
});

describe('error cases', () => {
  it('rh > 100 % is infeasible', () => {
    expect(() => solveState('tdb', 25, 'rh', 1.2, 101.325)).toThrow(SolveError);
  });
  it('dew point above dry-bulb is infeasible', () => {
    expect(() => solveState('tdb', 25, 'tdp', 30, 101.325)).toThrow(SolveError);
  });
  it('w above saturation is infeasible', () => {
    expect(() => solveState('tdb', 25, 'w', 0.05, 101.325)).toThrow(SolveError);
  });
  it('(tdp, w) is degenerate — both fix only vapor pressure', () => {
    expect(() => solveState('tdp', 13.9, 'w', 0.009882, 101.325))
      .toThrow(/don't determine|does not determine/i);
  });
  it('(tdp, w) with inconsistent values is infeasible', () => {
    expect(() => solveState('tdp', 5, 'w', 0.009882, 101.325)).toThrow(SolveError);
  });
  it('non-finite input is rejected', () => {
    expect(() => solveState('tdb', NaN, 'rh', 0.5, 101.325)).toThrow(SolveError);
  });
  it('sub-absolute-zero tdp is rejected as infeasible, never NaN output', () => {
    let caught: unknown;
    try {
      solveState('tdp', -300, 'h', 20, 101.325);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(SolveError);
    expect((caught as SolveError).code).toBe('infeasible');
  });
});

describe('cross-check vs psychrolib (dev-only)', () => {
  it('humidity ratio agrees to 1e-6', () => {
    psychrolib.SetUnitSystem(psychrolib.SI);
    const wLib = psychrolib.GetHumRatioFromRelHum(25, 0.5, 101325);
    expect(wFromRh(25, 0.5, 101.325)).toBeCloseTo(wLib, 6);
  });
  it('enthalpy agrees to 1e-4', () => {
    const w = wFromRh(25, 0.5, 101.325);
    expect(enthalpy(25, w)).toBeCloseTo(psychrolib.GetMoistAirEnthalpy(25, w) / 1000, 4);
  });
  it('specific volume agrees to 1e-4', () => {
    const w = wFromRh(25, 0.5, 101.325);
    expect(specificVolume(25, w, 101.325))
      .toBeCloseTo(psychrolib.GetMoistAirVolume(25, w, 101325), 4);
  });
  it('dew point agrees to 0.01 °C', () => {
    expect(airState(25, 0.009882, 101.325).tdp)
      .toBeCloseTo(psychrolib.GetTDewPointFromRelHum(25, 0.5), 2);
  });
});
