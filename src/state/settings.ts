// src/state/settings.ts
import { create } from 'zustand';
import { pressureAtAltitude } from '../math/pressure';
import type { UnitSystem } from '../math/units';

interface SettingsState {
  unitSystem: UnitSystem;
  altitudeM: number;
  pressureOverrideKPa: number | null;
  setUnitSystem(s: UnitSystem): void;
  setAltitudeM(m: number): void;
  setPressureOverrideKPa(kPa: number | null): void;
}

export const useSettings = create<SettingsState>((set) => ({
  unitSystem: 'si',
  altitudeM: 0,
  pressureOverrideKPa: null,
  setUnitSystem: (unitSystem) => set({ unitSystem }),
  setAltitudeM: (altitudeM) => set({ altitudeM }),
  setPressureOverrideKPa: (pressureOverrideKPa) => set({ pressureOverrideKPa }),
}));

export function effectivePressure(s: {
  pressureOverrideKPa: number | null;
  altitudeM: number;
}): number {
  return s.pressureOverrideKPa ?? pressureAtAltitude(s.altitudeM);
}
