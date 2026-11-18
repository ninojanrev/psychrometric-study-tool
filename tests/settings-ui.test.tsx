// tests/settings-ui.test.tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { airState } from '../src/math/air';
import { SettingsSheet } from '../src/ui/components/SettingsSheet';
import { useCurrent } from '../src/state/current';
import { usePoints } from '../src/state/points';
import { useSettings } from '../src/state/settings';

beforeEach(() => {
  localStorage.clear();
  usePoints.setState({ points: [], storageFailed: false });
  useSettings.setState({ unitSystem: 'si', altitudeM: 0, pressureOverrideKPa: null });
  useCurrent.getState().setProbe(airState(25, 0.009882, 101.325));
});

describe('SettingsSheet', () => {
  it('switches the unit system and readouts follow', () => {
    render(
      <>
        <SettingsSheet />
        <span data-testid="db">{useSettings.getState().unitSystem}</span>
      </>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'IP' }));
    expect(useSettings.getState().unitSystem).toBe('ip');
  });

  it('sets altitude', () => {
    render(<SettingsSheet />);
    fireEvent.change(screen.getByLabelText(/altitude/i), { target: { value: '1500' } });
    expect(useSettings.getState().altitudeM).toBeCloseTo(1500, 0);
  });

  it('clearing the altitude field does not reset the stored altitude', () => {
    useSettings.setState({ unitSystem: 'si', altitudeM: 1500, pressureOverrideKPa: null });
    render(<SettingsSheet />);
    fireEvent.change(screen.getByLabelText(/altitude/i), { target: { value: '' } });
    expect(useSettings.getState().altitudeM).toBe(1500);
  });

  it('clears all saved points after confirm', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    usePoints.getState().add('X', airState(25, 0.01, 101.325));
    render(<SettingsSheet />);
    fireEvent.click(screen.getByRole('button', { name: /reset saved points/i }));
    expect(usePoints.getState().points).toHaveLength(0);
    vi.restoreAllMocks();
  });
});
