// src/chart/ticks.ts
// Axis tick steps: nice 1/2/5 × 10ⁿ steps chosen so consecutive labels
// keep a minimum pixel gap at the current zoom level.
export function pickStep(span: number, px: number, minPx: number): number {
  const raw = (span / Math.max(1, px)) * minPx;
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const m of [1, 2, 5, 10]) {
    if (m * mag >= raw) return m * mag;
  }
  return 10 * mag;
}

export function tickDecimals(step: number): number {
  if (step >= 1) return 0;
  return Math.min(6, Math.ceil(-Math.log10(step) - 1e-9));
}

export function fmtTick(v: number, step: number): string {
  return parseFloat(v.toFixed(tickDecimals(step))).toString();
}
