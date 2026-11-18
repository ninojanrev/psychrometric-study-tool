// tests/calculator.test.tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CalculatorSheet } from '../src/ui/components/CalculatorSheet';
import { useSettings } from '../src/state/settings';

beforeEach(() => {
  useSettings.setState({ unitSystem: 'si', altitudeM: 0, pressureOverrideKPa: null });
});

describe('CalculatorSheet', () => {
  it('solves the rest of the state from any two inputs', () => {
    render(<CalculatorSheet />);
    fireEvent.change(screen.getByLabelText(/dry-bulb/i), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText(/relative humidity/i), { target: { value: '50' } });
    // jest-dom v7 compares number-input values as numbers (not strings)
    expect(screen.getByLabelText(/wet-bulb/i)).toHaveValue(17.9);
    expect(screen.getByLabelText(/dew point/i)).toHaveValue(13.9);
    expect(screen.getByText(/Inputs:/)).toHaveTextContent('Dry-bulb');
  });

  it('rolling rule: editing a third field makes it an input and drops the oldest', () => {
    render(<CalculatorSheet />);
    fireEvent.change(screen.getByLabelText(/dry-bulb/i), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText(/relative humidity/i), { target: { value: '50' } });
    // Typed value must differ from the displayed one (13.9, the computed dew
    // point) or React's value tracker suppresses the change event entirely.
    fireEvent.change(screen.getByLabelText(/dew point/i), { target: { value: '13.8' } });
    expect(screen.getByText(/Inputs:/)).toHaveTextContent('Dew point');
    expect(screen.getByText(/Inputs:/)).not.toHaveTextContent('Dry-bulb');
  });

  it('shows a plain-language error for infeasible input', () => {
    render(<CalculatorSheet />);
    fireEvent.change(screen.getByLabelText(/dry-bulb/i), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText(/relative humidity/i), { target: { value: '150' } });
    expect(screen.getByText(/more moisture than the air can/i)).toBeInTheDocument();
    // jest-dom v7 reads an empty number input as null, not ''
    expect(screen.getByLabelText(/wet-bulb/i)).toHaveValue(null);
  });

  it('re-solves when altitude changes', () => {
    render(<CalculatorSheet />);
    fireEvent.change(screen.getByLabelText(/dry-bulb/i), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText(/relative humidity/i), { target: { value: '50' } });
    const before = screen.getByLabelText(/spec\. volume/i).getAttribute('value');
    fireEvent.change(screen.getByLabelText(/^Altitude/), { target: { value: '3000' } });
    const after = screen.getByLabelText(/spec\. volume/i).getAttribute('value');
    expect(after).not.toBe(before);
  });
});
