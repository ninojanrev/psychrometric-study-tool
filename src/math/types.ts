// src/math/types.ts
export type PropertyName = 'tdb' | 'twb' | 'tdp' | 'rh' | 'w' | 'h' | 'v';

export interface AirState {
  p: number;    // kPa
  tdb: number;  // °C
  w: number;    // kg water / kg dry air
  rh: number;   // 0..1
  twb: number;  // °C
  tdp: number;  // °C
  h: number;    // kJ/kg dry air
  v: number;    // m³/kg dry air
  pv: number;   // kPa
  pws: number;  // kPa, saturation pressure at tdb
  mu: number;   // degree of saturation, 0..1
}
