// src/state/points.ts
import { create } from 'zustand';
import type { AirState } from '../math/types';

export interface SavedPoint {
  id: string;
  label: string;
  state: AirState;
  createdAt: number;
}

const KEY = 'psychro-points-v1';

function load(): SavedPoint[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedPoint[]) : [];
  } catch {
    return [];
  }
}

function persist(points: SavedPoint[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(points));
    return true;
  } catch {
    return false;
  }
}

interface PointsState {
  points: SavedPoint[];
  storageFailed: boolean;
  add(label: string, state: AirState): void;
  remove(id: string): void;
  clear(): void;
}

export const usePoints = create<PointsState>((set, get) => ({
  points: load(),
  storageFailed: false,
  add: (label, state) => {
    const point: SavedPoint = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
      label,
      state,
      createdAt: Date.now(),
    };
    const points = [...get().points, point];
    set({ points, storageFailed: !persist(points) });
  },
  remove: (id) => {
    const points = get().points.filter((pt) => pt.id !== id);
    set({ points, storageFailed: !persist(points) });
  },
  clear: () => set({ points: [], storageFailed: !persist([]) }),
}));
