import type { AirState } from '../../math/types';
import type { SavedPoint } from '../../state/points';
import {
  clipSegmentsToViewport, enthalpyPath, rhPath, saturationPath, volumePath, wetBulbPath,
  type Pt,
} from '../paths';
import { chartToPixel } from '../viewport';
import type { Viewport } from '../viewport';

export interface ChartColors {
  grid: string; gridStrong: string; axis: string; rh: string; enthalpy: string;
  wetbulb: string; volume: string; saturation: string; label: string;
  probe: string; probeFill: string; pin: string; pinText: string;
}

export interface DrawOptions {
  probe: AirState | null;
  points: SavedPoint[];
  colors: ChartColors;
}

// Level-of-detail: grid step shrinks as the visible span shrinks (spec §6)
function tStep(span: number): number {
  if (span > 25) return 1;
  if (span > 10) return 0.5;
  if (span > 4) return 0.1;
  return 0.02;
}

function wStep(span: number): number {
  if (span > 0.02) return 0.005;
  if (span > 0.008) return 0.001;
  return 0.0002;
}

function strokeFamily(
  ctx: CanvasRenderingContext2D, pts: Pt[], vp: Viewport, width: number, height: number,
): void {
  for (const seg of clipSegmentsToViewport(pts, vp)) {
    ctx.beginPath();
    seg.forEach(([t, w], i) => {
      const { x, y } = chartToPixel(vp, t, w, width, height);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
}

function labelAt(ctx: CanvasRenderingContext2D, text: string, t: number, w: number, vp: Viewport, width: number, height: number, colors: ChartColors): void {
  const { x, y } = chartToPixel(vp, t, w, width, height);
  if (x < -40 || x > width + 40 || y < -20 || y > height + 20) return;
  ctx.fillStyle = colors.label;
  ctx.font = '10px system-ui';
  ctx.fillText(text, x + 3, y - 3);
}

export function drawChart(
  ctx: CanvasRenderingContext2D, vp: Viewport, width: number, height: number, p: number,
  opts: DrawOptions,
): void {
  const { colors, probe, points } = opts;
  ctx.clearRect(0, 0, width, height);

  // Minor grid with LOD
  const ts = tStep(vp.tmax - vp.tmin);
  const ws = wStep(vp.wmax - vp.wmin);
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = colors.grid;
  for (let t = Math.ceil(vp.tmin / ts) * ts; t <= vp.tmax; t += ts) {
    const { x } = chartToPixel(vp, t, 0, width, height);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let w = Math.ceil(vp.wmin / ws) * ws; w <= vp.wmax; w += ws) {
    const { y } = chartToPixel(vp, 0, w, width, height);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  // Axis labels (every other line when dense)
  ctx.fillStyle = colors.axis;
  ctx.font = '10px system-ui';
  const tLabelEvery = ts * (width / (vp.tmax - vp.tmin)) < 36 ? 2 : 1;
  let idx = 0;
  for (let t = Math.ceil(vp.tmin / ts) * ts; t <= vp.tmax; t += ts, idx++) {
    if (idx % tLabelEvery !== 0) continue;
    const { x, y } = chartToPixel(vp, t, vp.wmin, width, height);
    ctx.fillText(t.toFixed(ts < 1 ? 2 : 0), x - 8, Math.min(y - 4, height - 4));
  }
  idx = 0;
  const wLabelEvery = ws * (height / (vp.wmax - vp.wmin)) < 24 ? 2 : 1;
  for (let w = Math.ceil(vp.wmin / ws) * ws; w <= vp.wmax; w += ws, idx++) {
    if (idx % wLabelEvery !== 0) continue;
    const { y } = chartToPixel(vp, vp.tmin, w, width, height);
    ctx.fillText(w.toFixed(ws < 0.001 ? 4 : 3), 2, y - 2);
  }

  // RH lines 10–90 %
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = colors.rh;
  for (let r = 1; r <= 9; r++) strokeFamily(ctx, rhPath(r / 10, vp, p), vp, width, height);

  // Enthalpy lines 0–145 kJ/kg, every 5
  ctx.strokeStyle = colors.enthalpy;
  for (let h = 0; h <= 145; h += 5) {
    const pts = enthalpyPath(h, vp);
    strokeFamily(ctx, pts, vp, width, height);
    if (pts.length > 0 && h % 10 === 0) {
      const mid = pts[Math.floor(pts.length / 2)];
      labelAt(ctx, String(h), mid[0], mid[1], vp, width, height, colors);
    }
  }

  // Wet-bulb lines −8…40 °C, every 2
  ctx.strokeStyle = colors.wetbulb;
  for (let twb = -8; twb <= 40; twb += 2) {
    const pts = wetBulbPath(twb, vp, p);
    strokeFamily(ctx, pts, vp, width, height);
    if (pts.length > 0 && twb % 10 === 0) {
      const mid = pts[Math.floor(pts.length / 2)];
      labelAt(ctx, `${twb}`, mid[0], mid[1], vp, width, height, colors);
    }
  }

  // Volume lines 0.75–0.90 m³/kg, every 0.01
  ctx.strokeStyle = colors.volume;
  for (let v = 0.75; v <= 0.901; v += 0.01) {
    const pts = volumePath(Math.round(v * 100) / 100, vp, p);
    strokeFamily(ctx, pts, vp, width, height);
    if (pts.length > 0) {
      const mid = pts[Math.floor(pts.length / 2)];
      if (mid[0] > vp.tmin + 1 && mid[0] < vp.tmax - 1) {
        labelAt(ctx, v.toFixed(2), mid[0], mid[1], vp, width, height, colors);
      }
    }
  }

  // Saturation curve on top of families
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = colors.saturation;
  strokeFamily(ctx, saturationPath(vp, p), vp, width, height);

  // Saved points
  for (const pt of points) {
    const { x, y } = chartToPixel(vp, pt.state.tdb, pt.state.w, width, height);
    if (x < -30 || x > width + 30 || y < -30 || y > height + 30) continue;
    ctx.fillStyle = colors.pin;
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = colors.pinText;
    ctx.font = 'bold 11px system-ui';
    ctx.fillText(pt.label, x + 8, y - 6);
  }

  // Probe marker
  if (probe) {
    const { x, y } = chartToPixel(vp, probe.tdb, probe.w, width, height);
    ctx.fillStyle = colors.probeFill;
    ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = colors.probe;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 18, y); ctx.lineTo(x + 18, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x, y + 18); ctx.stroke();
  }
}

export function chartColors(): ChartColors {
  const css = getComputedStyle(document.documentElement);
  const get = (name: string) => css.getPropertyValue(name).trim() || '#888';
  return {
    grid: get('--chart-grid'),
    gridStrong: get('--chart-grid-strong'),
    axis: get('--chart-axis'),
    rh: get('--chart-rh'),
    enthalpy: get('--chart-enthalpy'),
    wetbulb: get('--chart-wetbulb'),
    volume: get('--chart-volume'),
    saturation: get('--chart-saturation'),
    label: get('--chart-label'),
    probe: get('--chart-probe'),
    probeFill: get('--chart-probe-fill'),
    pin: get('--chart-pin'),
    pinText: get('--chart-pin-text'),
  };
}
