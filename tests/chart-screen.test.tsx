// tests/chart-screen.test.tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { airState } from '../src/math/air';
import { ChartScreen } from '../src/ui/screens/ChartScreen';
import { useCurrent } from '../src/state/current';
import { usePoints } from '../src/state/points';

beforeEach(() => {
  localStorage.clear();
  usePoints.setState({ points: [], storageFailed: false });
  useCurrent.setState({ probe: null, activePair: ['tdb', 'rh'], openSheet: null });
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
