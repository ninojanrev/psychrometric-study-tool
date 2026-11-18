import { convert } from '../math/units';
import type { UnitQuantity, UnitSystem } from '../math/units';

const QUANTITY_OF: Record<string, UnitQuantity> = {
  tdb: 'tdb', twb: 'twb', tdp: 'tdp', w: 'w', h: 'h', v: 'v', p: 'p', pv: 'pv',
};

export function fmt(quantity: UnitQuantity, siValue: number, system: UnitSystem, digits: number): string {
  const v = convert(quantity, siValue, 'si', system);
  return v.toFixed(digits);
}

export function fmtState(s: {
  tdb: number; rh: number; w: number; h: number; twb: number; tdp: number; v: number; p: number;
}, system: UnitSystem): { key: string; value: string }[] {
  const temp = system === 'si' ? '°C' : '°F';
  return [
    { key: system === 'si' ? 'DB (°C)' : 'DB (°F)', value: fmt('tdb', s.tdb, system, 1) },
    { key: 'RH (%)', value: (s.rh * 100).toFixed(1) },
    { key: system === 'si' ? 'W (kg/kg)' : 'W (lb/lb)', value: fmt('w', s.w, system, 5) },
    { key: system === 'si' ? 'h (kJ/kg)' : 'h (Btu/lb)', value: fmt('h', s.h, system, 1) },
    { key: `Twb (${temp})`, value: fmt('twb', s.twb, system, 1) },
    { key: `Tdp (${temp})`, value: fmt('tdp', s.tdp, system, 1) },
    { key: system === 'si' ? 'v (m³/kg)' : 'v (ft³/lb)', value: fmt('v', s.v, system, 3) },
    { key: system === 'si' ? 'P (kPa)' : 'P (inHg)', value: fmt('p', s.p, system, 2) },
  ];
}

export { QUANTITY_OF };
