// tests/bookmarks.test.tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { airState } from '../src/math/air';
import { BookmarksSheet } from '../src/ui/components/BookmarksSheet';
import { useCurrent } from '../src/state/current';
import { usePoints } from '../src/state/points';

beforeEach(() => {
  localStorage.clear();
  usePoints.setState({ points: [], storageFailed: false });
  useCurrent.setState({ probe: null, activePair: ['tdb', 'rh'], openSheet: null, navRequest: null });
});

describe('BookmarksSheet', () => {
  it('Go probes the state and requests chart navigation', () => {
    usePoints.getState().add('Classroom', airState(25, 0.01, 101.325));
    render(<BookmarksSheet />);
    // anchored so the delete button ("Delete Classroom") doesn't also match
    fireEvent.click(screen.getByRole('button', { name: /^Classroom/i }));
    expect(useCurrent.getState().probe?.tdb).toBeCloseTo(25, 5);
    const nav = useCurrent.getState().navRequest;
    expect(nav).not.toBeNull();
    expect(nav!.t).toBeCloseTo(25, 5);
    expect(nav!.w).toBeCloseTo(0.01, 6);
  });

  it('re-clicking Go issues a fresh nav request (seq increments)', () => {
    usePoints.getState().add('Corner', airState(20, 0.008, 101.325));
    render(<BookmarksSheet />);
    const go = screen.getByRole('button', { name: /^Corner/i });
    fireEvent.click(go);
    const first = useCurrent.getState().navRequest!;
    fireEvent.click(go);
    const second = useCurrent.getState().navRequest!;
    expect(second.seq).toBe(first.seq + 1);
  });

  it('Delete asks for confirmation and only removes on OK', () => {
    usePoints.getState().add('Lab 2', airState(30, 0.015, 101.325));
    render(<BookmarksSheet />);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    fireEvent.click(screen.getByRole('button', { name: /delete lab 2/i }));
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(usePoints.getState().points).toHaveLength(1);
    confirmSpy.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: /delete lab 2/i }));
    expect(usePoints.getState().points).toHaveLength(0);
    confirmSpy.mockRestore();
  });

  it('shows an empty state when nothing is saved', () => {
    render(<BookmarksSheet />);
    expect(screen.getByText(/no saved points yet/i)).toBeInTheDocument();
  });
});
