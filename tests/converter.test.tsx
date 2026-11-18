// tests/converter.test.tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ConverterSheet } from '../src/ui/components/ConverterSheet';
import { useSettings } from '../src/state/settings';

beforeEach(() => {
  useSettings.setState({ unitSystem: 'si', altitudeM: 0, pressureOverrideKPa: null });
});

describe('ConverterSheet', () => {
  it('converts SI to IP in Units mode', () => {
    render(<ConverterSheet />);
    fireEvent.click(screen.getByRole('button', { name: 'Units' }));
    fireEvent.change(screen.getByLabelText(/value/i), { target: { value: '25' } });
    expect(screen.getByText(/77\.0/)).toBeInTheDocument();
  });

  it('shows all equivalents in Equivalents mode', () => {
    render(<ConverterSheet />);
    fireEvent.click(screen.getByRole('button', { name: 'Equivalents' }));
    // the property select defaults to Relative humidity; type 50 % into its Value field
    fireEvent.change(screen.getByLabelText('Value'), { target: { value: '50' } });
    expect(screen.getByText(/17\.9/)).toBeInTheDocument(); // wet-bulb at 25 °C / 50 %
    expect(screen.getByText(/13\.9/)).toBeInTheDocument(); // dew point
  });

  it('converts altitude to pressure', () => {
    render(<ConverterSheet />);
    fireEvent.click(screen.getByRole('button', { name: /altitude/i }));
    fireEvent.change(screen.getByLabelText(/altitude/i), { target: { value: '1500' } });
    expect(screen.getByText(/84\.56/)).toBeInTheDocument();
  });
});
