// tests/chart-screen.test.tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { airState } from '../src/math/air';
import { chartToPixel, makeViewport } from '../src/chart/viewport';
import { ChartScreen } from '../src/ui/screens/ChartScreen';
import { useCurrent } from '../src/state/current';
import { usePoints } from '../src/state/points';

beforeEach(() => {
  localStorage.clear();
  usePoints.setState({ points: [], storageFailed: false });
  useCurrent.setState({ probe: null, activePair: ['tdb', 'rh'], openSheet: null, navRequest: null });
});

describe('ChartScreen store reactivity', () => {
  it('re-renders the readout when the probe store changes', () => {
    render(<ChartScreen />);
    act(() => useCurrent.getState().setProbe(airState(25, 0.009882, 101.325)));
    expect(screen.getByText(/25\.0/)).toBeInTheDocument();
  });

  it('re-renders chips when points change', () => {
    render(<ChartScreen />);
    act(() => usePoints.getState().add('T15 fix', airState(25, 0.01, 101.325)));
    expect(screen.getByText('T15 fix')).toBeInTheDocument();
  });

  it('shows the storage notice when persistence fails', () => {
    render(<ChartScreen />);
    act(() => usePoints.setState({ storageFailed: true }));
    expect(screen.getByText(/storage unavailable/i)).toBeInTheDocument();
  });
});

function firePointer(canvas: HTMLCanvasElement, type: string, x: number, y: number) {
  const e = new Event(type, { bubbles: true });
  Object.assign(e, { pointerId: 1, clientX: x, clientY: y });
  canvas.dispatchEvent(e);
}

function mockCanvasGeometry(canvas: HTMLCanvasElement) {
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 400, 300));
  vi.spyOn(canvas, 'clientWidth', 'get').mockReturnValue(400);
  vi.spyOn(canvas, 'clientHeight', 'get').mockReturnValue(300);
}

describe('dock, FAB, and tap-to-clear', () => {
  it('hides the dock until a point is probed, then slides it in', () => {
    render(<ChartScreen />);
    const dock = document.querySelector('.dock') as HTMLElement;
    expect(dock.className).not.toContain('dock-visible');
    act(() => useCurrent.getState().setProbe(airState(25, 0.009882, 101.325)));
    expect(dock.className).toContain('dock-visible');
  });

  it('FAB saves the probed point under a prompted label', () => {
    render(<ChartScreen />);
    act(() => useCurrent.getState().setProbe(airState(25, 0.009882, 101.325)));
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Lecture hall');
    fireEvent.click(screen.getByRole('button', { name: /save probed point/i }));
    expect(usePoints.getState().points).toHaveLength(1);
    expect(usePoints.getState().points[0].label).toBe('Lecture hall');
    promptSpy.mockRestore();
  });

  it('cancelling the FAB prompt saves nothing', () => {
    render(<ChartScreen />);
    act(() => useCurrent.getState().setProbe(airState(25, 0.009882, 101.325)));
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null);
    fireEvent.click(screen.getByRole('button', { name: /save probed point/i }));
    expect(usePoints.getState().points).toHaveLength(0);
    promptSpy.mockRestore();
  });

  it('tapping the probed crosshair clears the probe', () => {
    render(<ChartScreen />);
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    mockCanvasGeometry(canvas);
    const st = airState(25, 0.009882, 101.325);
    act(() => useCurrent.getState().setProbe(st));
    const px = chartToPixel(makeViewport(), st.tdb, st.w, 400, 300);
    firePointer(canvas, 'pointerdown', px.x, px.y);
    firePointer(canvas, 'pointerup', px.x, px.y);
    expect(useCurrent.getState().probe).toBeNull();
  });

  it('tapping away from the crosshair re-probes a new state', () => {
    render(<ChartScreen />);
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    mockCanvasGeometry(canvas);
    const st = airState(25, 0.009882, 101.325);
    act(() => useCurrent.getState().setProbe(st));
    // plot-rect math: t = -10 + (350-44)/348 × 65 ≈ 47.1552
    firePointer(canvas, 'pointerdown', 350, 40);
    firePointer(canvas, 'pointerup', 350, 40);
    const after = useCurrent.getState().probe;
    expect(after).not.toBeNull();
    expect(after!.tdb).toBeCloseTo(47.1552, 2);
  });
});
