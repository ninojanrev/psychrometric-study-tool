// src/chart/probe.ts
import { airState } from '../math/air';
import type { AirState } from '../math/types';
import { pixelToChart } from './viewport';
import type { Viewport } from './viewport';

export function probeAt(
  vp: Viewport, x: number, y: number, width: number, height: number, p: number,
): AirState {
  const { t, w } = pixelToChart(vp, x, y, width, height);
  return airState(t, Math.max(0, w), p);
}
