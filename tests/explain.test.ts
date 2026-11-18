// tests/explain.test.ts
import { describe, expect, it } from 'vitest';
import { airState } from '../src/math/air';
import { equationsFor } from '../src/math/explain';

describe('equationsFor', () => {
  const s = airState(25, 0.009882, 101.325);

  it('explains humidity ratio with substituted numbers', () => {
    const w = equationsFor(s).find((e) => e.title.includes('Humidity ratio'))!;
    expect(w.text).toContain('0.621945');
    expect(w.text).toContain('0.00988');
  });
  it('explains enthalpy with the result', () => {
    const h = equationsFor(s).find((e) => e.title.includes('Enthalpy'))!;
    expect(h.text).toContain('50.3');
  });
  it('explains relative humidity', () => {
    const rh = equationsFor(s).find((e) => e.title.includes('Relative humidity'))!;
    expect(rh.text).toContain('50.0');
  });
  it('covers every student-facing property', () => {
    const titles = equationsFor(s).map((e) => e.title).join(' ');
    for (const t of ['Humidity ratio', 'Enthalpy', 'Relative humidity', 'Specific volume', 'Dew point', 'Wet-bulb']) {
      expect(titles).toContain(t);
    }
  });
});
