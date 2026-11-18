// src/state/current.ts
import { create } from 'zustand';
import type { AirState, PropertyName } from '../math/types';

export type SheetName = 'calculator' | 'converter' | 'bookmarks' | 'settings' | null;

export interface NavRequest { t: number; w: number; seq: number; }

interface CurrentState {
  probe: AirState | null;
  probeIsFog: boolean;
  activePair: [PropertyName, PropertyName];
  openSheet: SheetName;
  navRequest: NavRequest | null;
  setProbe(s: AirState | null): void;
  setActivePair(pair: [PropertyName, PropertyName]): void;
  setOpenSheet(s: SheetName): void;
  requestNav(t: number, w: number): void;
}

export const useCurrent = create<CurrentState>((set, get) => ({
  probe: null,
  probeIsFog: false,
  activePair: ['tdb', 'rh'],
  openSheet: null,
  navRequest: null,
  setProbe: (probe) => set({ probe, probeIsFog: probe ? probe.rh > 1.0005 : false }),
  setActivePair: (activePair) => set({ activePair }),
  setOpenSheet: (openSheet) => set({ openSheet }),
  // seq bumps on every request so re-navigating to the same point still pans
  requestNav: (t, w) => set({ navRequest: { t, w, seq: (get().navRequest?.seq ?? 0) + 1 } }),
}));
