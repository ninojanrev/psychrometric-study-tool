// tests/converter.test.tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ConverterSheet } from '../src/ui/components/ConverterSheet';
import { useSettings } from '../src/state/settings';

beforeEach(() => {
  useSettings.setState({ unitSystem: 'si', altitudeM: 0, pressureOverrideKPa: null });
});

describe('ConverterSheet', () => {
  it('Units mode converts SI → IP', () => {
    render(<ConverterSheet />);
    fireEvent.change(screen.getByLabelText(/SI \(/), { target: { value: '25' } });
    expect(screen.getByLabelText(/IP \(/)).toHaveValue(77);
    expect(screen.getByText(/either box/i)).toBeInTheDocument();
  });

  it('Units mode converts IP → SI (two-way)', () => {
    render(<ConverterSheet />);
    fireEvent.change(screen.getByLabelText(/IP \(/), { target: { value: '77' } });
    expect(screen.getByLabelText(/SI \(/)).toHaveValue(25);
  });

  it('Air state mode lists every property at the state', () => {
    render(<ConverterSheet />);
    fireEvent.click(screen.getByRole('button', { name: 'Air state' }));
    // defaults: 25 °C dry-bulb, known property Relative humidity (%)
    fireEvent.change(screen.getByLabelText(/value/i), { target: { value: '50' } });
    expect(screen.getByText(/17\.9/)).toBeInTheDocument(); // wet-bulb
    expect(screen.getByText(/13\.9/)).toBeInTheDocument(); // dew point
    expect(screen.getByText(/All properties at this state:/i)).toBeInTheDocument();
  });

  it('Air state mode shows a plain-language error for infeasible input', () => {
    render(<ConverterSheet />);
    fireEvent.click(screen.getByRole('button', { name: 'Air state' }));
    fireEvent.change(screen.getByLabelText(/value/i), { target: { value: '150' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/more moisture than the air can/i);
  });

  it('converts altitude to pressure', () => {
    render(<ConverterSheet />);
    fireEvent.click(screen.getByRole('button', { name: /altitude/i }));
    fireEvent.change(screen.getByLabelText(/altitude/i), { target: { value: '1500' } });
    expect(screen.getByText(/84\.56/)).toBeInTheDocument();
  });
});
