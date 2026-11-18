// tests/stores.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { airState } from '../src/math/air';
import { useCurrent } from '../src/state/current';
import { usePoints } from '../src/state/points';
import { effectivePressure, useSettings } from '../src/state/settings';

beforeEach(() => {
  localStorage.clear();
  usePoints.setState({ points: [], storageFailed: false });
});

describe('settings', () => {
  it('effective pressure prefers override, else altitude', () => {
    useSettings.setState({ altitudeM: 0, pressureOverrideKPa: null });
    expect(effectivePressure(useSettings.getState())).toBeCloseTo(101.325, 3);
    useSettings.setState({ altitudeM: 1500 });
    expect(effectivePressure(useSettings.getState())).toBeCloseTo(84.556, 1);
    useSettings.setState({ pressureOverrideKPa: 100 });
    expect(effectivePressure(useSettings.getState())).toBe(100);
  });
});

describe('current', () => {
  it('flags fog region when rh exceeds 100 %', () => {
    useCurrent.getState().setProbe(airState(30, 0.05, 101.325));
    expect(useCurrent.getState().probeIsFog).toBe(true);
    useCurrent.getState().setProbe(airState(25, 0.009882, 101.325));
    expect(useCurrent.getState().probeIsFog).toBe(false);
  });
});

describe('points persistence', () => {
  it('adds, persists, removes', () => {
    usePoints.getState().add('Q3', airState(25, 0.009882, 101.325));
    expect(usePoints.getState().points).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('psychro-points-v1')!)).toHaveLength(1);
    const id = usePoints.getState().points[0].id;
    usePoints.getState().remove(id);
    expect(usePoints.getState().points).toHaveLength(0);
  });
  it('falls back to memory when storage fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    usePoints.getState().add('X', airState(25, 0.01, 101.325));
    expect(usePoints.getState().points).toHaveLength(1);
    expect(usePoints.getState().storageFailed).toBe(true);
    vi.restoreAllMocks();
  });
});
