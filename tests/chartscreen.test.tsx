// tests/chartscreen.test.tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { airState } from '../src/math/air';
import { ChartScreen } from '../src/ui/screens/ChartScreen';
import { useCurrent } from '../src/state/current';
import { usePoints } from '../src/state/points';
import { useSettings } from '../src/state/settings';

beforeEach(() => {
  localStorage.clear();
  usePoints.setState({ points: [], storageFailed: false });
  useCurrent.getState().setProbe(null);
  useCurrent.getState().setOpenSheet(null);
  useSettings.setState({ unitSystem: 'si', altitudeM: 0, pressureOverrideKPa: null });
});

describe('ChartScreen', () => {
  it('renders the canvas and shows the readout card when a probe is set', () => {
    render(<ChartScreen />);
    expect(screen.getByRole('presentation')).toBeInTheDocument(); // canvas
    act(() => { useCurrent.getState().setProbe(airState(25, 0.009882, 101.325)); });
    expect(screen.getByText(/25\.0/)).toBeInTheDocument();
    expect(screen.getByText('50.0')).toBeInTheDocument(); // RH value; the key cell reads "RH (%)"
    expect(screen.getByText('RH (%)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /calculator/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /convert/i })).toBeInTheDocument();
  });

  it('shows fog warning for supersaturated probes', () => {
    render(<ChartScreen />);
    act(() => { useCurrent.getState().setProbe(airState(30, 0.05, 101.325)); });
    expect(screen.getByText(/fog region/i)).toBeInTheDocument();
  });

  it('save button adds a labeled point', () => {
    vi.spyOn(window, 'prompt').mockReturnValue('Q3 answer');
    render(<ChartScreen />);
    act(() => { useCurrent.getState().setProbe(airState(25, 0.009882, 101.325)); });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(usePoints.getState().points).toHaveLength(1);
    expect(usePoints.getState().points[0].label).toBe('Q3 answer');
    vi.restoreAllMocks();
  });
});
