// src/state/current.ts
import { create } from 'zustand';
import type { AirState, PropertyName } from '../math/types';

export type SheetName = 'calculator' | 'converter' | 'settings' | null;

interface CurrentState {
  probe: AirState | null;
  probeIsFog: boolean;
  activePair: [PropertyName, PropertyName];
  openSheet: SheetName;
  setProbe(s: AirState | null): void;
  setActivePair(pair: [PropertyName, PropertyName]): void;
  setOpenSheet(s: SheetName): void;
}

export const useCurrent = create<CurrentState>((set) => ({
  probe: null,
  probeIsFog: false,
  activePair: ['tdb', 'rh'],
  openSheet: null,
  setProbe: (probe) => set({ probe, probeIsFog: probe ? probe.rh > 1.0005 : false }),
  setActivePair: (activePair) => set({ activePair }),
  setOpenSheet: (openSheet) => set({ openSheet }),
}));
