// tests/units.test.ts
import { describe, expect, it } from 'vitest';
import { convert } from '../src/math/units';

describe('convert', () => {
  it('converts temperature C ↔ F', () => {
    expect(convert('tdb', 25, 'si', 'ip')).toBeCloseTo(77, 6);
    expect(convert('tdb', 77, 'ip', 'si')).toBeCloseTo(25, 6);
  });
  it('converts enthalpy kJ/kg ↔ Btu/lb (÷2.326)', () => {
    expect(convert('h', 50.33, 'si', 'ip')).toBeCloseTo(21.638, 3);
    expect(convert('h', 21.638, 'ip', 'si')).toBeCloseTo(50.33, 2);
  });
  it('converts specific volume m³/kg ↔ ft³/lb (×16.0185)', () => {
    expect(convert('v', 0.858, 'si', 'ip')).toBeCloseTo(13.744, 3);
  });
  it('converts pressure kPa ↔ inHg (1 inHg = 3.38639 kPa)', () => {
    expect(convert('p', 101.325, 'si', 'ip')).toBeCloseTo(29.921, 2);
  });
  it('humidity ratio lb/lb is scale-identical', () => {
    expect(convert('w', 0.00988, 'si', 'ip')).toBeCloseTo(0.00988, 10);
  });
  it('converts altitude m ↔ ft', () => {
    expect(convert('altitude', 3000, 'si', 'ip')).toBeCloseTo(9842.52, 1);
  });
  it('round trips every quantity', () => {
    const quantities = ['tdb', 'twb', 'tdp', 'w', 'h', 'v', 'p', 'pv', 'altitude'] as const;
    for (const q of quantities) {
      const ip = convert(q, 3.7, 'si', 'ip');
      expect(convert(q, ip, 'ip', 'si')).toBeCloseTo(3.7, 8);
    }
  });
});
