// tests/points-ui.test.tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { airState } from '../src/math/air';
import { SavedPointsChips } from '../src/ui/components/SavedPointsChips';
import { useCurrent } from '../src/state/current';
import { usePoints } from '../src/state/points';

const S = airState(25, 0.009882, 101.325);

beforeEach(() => {
  localStorage.clear();
  usePoints.setState({ points: [], storageFailed: false });
  useCurrent.getState().setProbe(null);
});

describe('SavedPointsChips', () => {
  it('renders a chip per saved point', () => {
    usePoints.getState().add('Q3 answer', S);
    render(<SavedPointsChips />);
    expect(screen.getByText('Q3 answer')).toBeInTheDocument();
  });

  it('tapping a chip makes that point the probe', () => {
    usePoints.getState().add('Q3 answer', S);
    render(<SavedPointsChips />);
    fireEvent.click(screen.getByText('Q3 answer'));
    expect(useCurrent.getState().probe?.tdb).toBeCloseTo(25, 3);
  });

  it('confirming delete removes the point', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    usePoints.getState().add('Q3 answer', S);
    render(<SavedPointsChips />);
    const chip = screen.getByText('Q3 answer');
    fireEvent.contextMenu(chip);
    expect(usePoints.getState().points).toHaveLength(0);
    vi.restoreAllMocks();
  });
});
