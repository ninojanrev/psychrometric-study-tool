// src/math/units.ts
export type UnitQuantity = 'tdb' | 'twb' | 'tdp' | 'w' | 'h' | 'v' | 'p' | 'pv' | 'altitude';
export type UnitSystem = 'si' | 'ip';

type Pair = { toIp: (v: number) => number; toSi: (v: number) => number };

// SI → IP and back, per quantity. SI bases: °C, kg/kg, kJ/kg, m³/kg, kPa, m
const FACTORS: Record<UnitQuantity, Pair> = {
  tdb: { toIp: (v) => v * 9 / 5 + 32, toSi: (v) => (v - 32) * 5 / 9 },
  twb: { toIp: (v) => v * 9 / 5 + 32, toSi: (v) => (v - 32) * 5 / 9 },
  tdp: { toIp: (v) => v * 9 / 5 + 32, toSi: (v) => (v - 32) * 5 / 9 },
  w: { toIp: (v) => v, toSi: (v) => v }, // lb/lb == kg/kg scale
  h: { toIp: (v) => v / 2.326, toSi: (v) => v * 2.326 },
  v: { toIp: (v) => v * 16.0185, toSi: (v) => v / 16.0185 },
  p: { toIp: (v) => v / 3.38639, toSi: (v) => v * 3.38639 },
  pv: { toIp: (v) => v / 3.38639, toSi: (v) => v * 3.38639 },
  altitude: { toIp: (v) => v / 0.3048, toSi: (v) => v * 0.3048 },
};

export function convert(quantity: UnitQuantity, value: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return value;
  return from === 'si' ? FACTORS[quantity].toIp(value) : FACTORS[quantity].toSi(value);
}
