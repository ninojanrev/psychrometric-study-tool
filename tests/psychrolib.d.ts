// Ambient types for psychrolib 1.1.1 (UMD/CJS instance export), aligned with the
// actual package API in node_modules/psychrolib/psychrolib.js:
// - Unit tokens are numeric properties of the instance (SI = 2, IP = 1); there is
//   no `UnitSystem` object in this version.
// - SetUnitSystem "HAS TO BE CALLED before the library can be used" (throws
//   "Unit system is not defined" otherwise).
// - Dew point from RH is named GetTDewPointFromRelHum (not GetDewPointFromRelHum).
// SI pressures are Pa; enthalpy is J/kg; temperatures are °C.
declare module 'psychrolib' {
  export const SI: number;
  export const IP: number;
  export function SetUnitSystem(units: number): void;
  export function GetSatVapPres(TC: number): number;
  export function GetHumRatioFromRelHum(TC: number, RelHum: number, Pressure: number): number;
  export function GetTDewPointFromRelHum(TC: number, RelHum: number): number;
  export function GetMoistAirEnthalpy(TC: number, HumRatio: number): number;
  export function GetMoistAirVolume(TC: number, HumRatio: number, Pressure: number): number;
}
