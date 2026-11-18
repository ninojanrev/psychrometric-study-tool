declare module 'psychrolib' {
  export function GetSatVapPres(TC: number): number;
  export function GetHumRatioFromRelHum(TC: number, RelHum: number, Pressure: number): number;
  export function GetDewPointFromRelHum(TC: number, RelHum: number): number;
  export function GetMoistAirEnthalpy(TC: number, HumRatio: number): number;
  export function GetMoistAirVolume(TC: number, HumRatio: number, Pressure: number): number;
}
