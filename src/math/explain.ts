import type { AirState } from './types';

const f = (v: number, d = 4) => v.toFixed(d);

export function equationsFor(s: AirState): { title: string; text: string }[] {
  return [
    {
      title: 'Humidity ratio W',
      text: `W = 0.621945 · Pv / (P − Pv)\n  = 0.621945 × ${f(s.pv, 4)} / (${f(s.p, 3)} − ${f(s.pv, 4)})\n  = ${f(s.w, 5)} kg/kg`,
    },
    {
      title: 'Relative humidity RH',
      text: `RH = Pv / Pws(Tdb)\n  = ${f(s.pv, 4)} / ${f(s.pws, 4)}\n  = ${(s.rh * 100).toFixed(1)} %`,
    },
    {
      title: 'Enthalpy h (per kg dry air)',
      text: `h = 1.006·Tdb + W·(2501 + 1.86·Tdb)\n  = 1.006 × ${f(s.tdb, 2)} + ${f(s.w, 5)} × (2501 + 1.86 × ${f(s.tdb, 2)})\n  = ${f(s.h, 2)} kJ/kg`,
    },
    {
      title: 'Specific volume v',
      text: `v = Ra·T·(1 + 1.607858·W) / P\n  = 287.055 × ${f(s.tdb + 273.15, 2)} × (1 + 1.607858 × ${f(s.w, 5)}) / (1000 × ${f(s.p, 3)})\n  = ${f(s.v, 4)} m³/kg`,
    },
    {
      title: 'Dew point Tdp',
      text: `Pws(Tdp) = Pv = ${f(s.pv, 4)} kPa\n  → Tdp = ${f(s.tdp, 2)} °C   (inverse of the Hyland–Wexler saturation curve)`,
    },
    {
      title: 'Wet-bulb Twb',
      text: `W = [(2501 − 2.326·Twb)·Ws(Twb) − 1.006·(Tdb − Twb)] / (2501 + 1.86·Tdb − 4.186·Twb)\n  solved iteratively for Twb = ${f(s.twb, 2)} °C at W = ${f(s.w, 5)}, Tdb = ${f(s.tdb, 2)} °C`,
    },
  ];
}
