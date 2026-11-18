// tests/viewport.test.ts
import { describe, expect, it } from 'vitest';
import { ENVELOPE, PLOT_PAD, centerOn, chartToPixel, makeViewport, panBy, pixelToChart, plotRect, zoomAt } from '../src/chart/viewport';

const W = 400, H = 300;

describe('mapping', () => {
  it('maps envelope corners to the plot rect (axis gutters excluded)', () => {
    const vp = makeViewport();
    const tl = chartToPixel(vp, ENVELOPE.tmin, ENVELOPE.wmax, W, H);
    const br = chartToPixel(vp, ENVELOPE.tmax, ENVELOPE.wmin, W, H);
    expect(tl).toEqual({ x: PLOT_PAD.left, y: PLOT_PAD.top });
    expect(br).toEqual({ x: W - PLOT_PAD.right, y: H - PLOT_PAD.bottom });
  });
  it('plot rect leaves room for axis labels inside the canvas', () => {
    const r = plotRect(W, H);
    expect(r.x).toBeGreaterThanOrEqual(30); // y labels fit left of the plot
    expect(r.y + r.h).toBeLessThanOrEqual(H - 14); // x labels fit below the plot
    expect(r.w).toBeGreaterThan(0);
    expect(r.h).toBeGreaterThan(0);
  });
  it('pixel→chart→pixel round trips', () => {
    const vp = makeViewport();
    const { t, w } = pixelToChart(vp, 137, 91, W, H);
    expect(chartToPixel(vp, t, w, W, H)).toEqual({ x: 137, y: 91 });
  });
});

describe('centerOn', () => {
  it('centers a chart point while keeping the current span', () => {
    const vp = makeViewport();
    const out = centerOn(vp, 22.5, 0.0165);
    expect(out.tmax - out.tmin).toBeCloseTo(vp.tmax - vp.tmin, 10);
    expect(out.wmax - out.wmin).toBeCloseTo(vp.wmax - vp.wmin, 10);
    // point maps back to the center of the plot rect
    const { x, y } = chartToPixel(out, 22.5, 0.0165, W, H);
    const r = plotRect(W, H);
    expect(x).toBeCloseTo(r.x + r.w / 2, 6);
    expect(y).toBeCloseTo(r.y + r.h / 2, 6);
  });
  it('keeps a full-envelope view stable (clamped, point still visible)', () => {
    const vp = makeViewport();
    const out = centerOn(vp, 22.5, 0.0165);
    expect(out.tmin).toBeGreaterThanOrEqual(ENVELOPE.tmin - 0.1 * 65 - 1e-9);
    expect(out.tmax).toBeLessThanOrEqual(ENVELOPE.tmax + 0.1 * 65 + 1e-9);
    const { x, y } = chartToPixel(out, 22.5, 0.0165, W, H);
    const r = plotRect(W, H);
    expect(x).toBeGreaterThanOrEqual(r.x);
    expect(x).toBeLessThanOrEqual(r.x + r.w);
    expect(y).toBeGreaterThanOrEqual(r.y);
    expect(y).toBeLessThanOrEqual(r.y + r.h);
  });
  it('pans a deep-zoom view so the target lands mid-plot', () => {
    let vp = zoomAt(makeViewport(), 0.01, 200, 150, W, H);
    const target = { t: 40, w: 0.02 };
    const out = centerOn(vp, target.t, target.w);
    const { x, y } = chartToPixel(out, target.t, target.w, W, H);
    const r = plotRect(W, H);
    expect(x).toBeCloseTo(r.x + r.w / 2, 6);
    expect(y).toBeCloseTo(r.y + r.h / 2, 6);
  });
});

describe('zoomAt', () => {
  it('keeps the chart point under the zoom anchor fixed', () => {
    let vp = makeViewport();
    const anchor = { x: 200, y: 150 };
    const before = pixelToChart(vp, anchor.x, anchor.y, W, H);
    vp = zoomAt(vp, 0.5, anchor.x, anchor.y, W, H);
    const after = pixelToChart(vp, anchor.x, anchor.y, W, H);
    expect(after.t).toBeCloseTo(before.t, 6);
    expect(after.w).toBeCloseTo(before.w, 8);
  });
  it('clamps maximum zoom to 600× of envelope span', () => {
    let vp = makeViewport();
    for (let i = 0; i < 50; i++) vp = zoomAt(vp, 0.5, 200, 150, W, H);
    expect(vp.tmax - vp.tmin).toBeGreaterThan(65 / 600 - 1e-6);
    expect(vp.tmax - vp.tmin).toBeLessThan(65 / 600 + 1e-3);
  });
  it('clamps zoom-out to the full envelope view (1×)', () => {
    const vp = zoomAt(makeViewport(), 2, 200, 150, W, H);
    expect(vp.tmax - vp.tmin).toBe(65); // exact clamped span: 55 - (-10)
    expect(vp.wmax - vp.wmin).toBeCloseTo(ENVELOPE.wmax - ENVELOPE.wmin, 12);
    expect(vp.tmin).toBeGreaterThanOrEqual(ENVELOPE.tmin);
    expect(vp.tmax).toBeLessThanOrEqual(ENVELOPE.tmax);
    expect(vp.wmin).toBeGreaterThanOrEqual(ENVELOPE.wmin);
    expect(vp.wmax).toBeLessThanOrEqual(ENVELOPE.wmax);
  });
  it('preserves the anchor through a zoom-in within an already zoomed state', () => {
    let vp = makeViewport();
    const anchor = { x: 260, y: 90 };
    vp = zoomAt(vp, 0.5, anchor.x, anchor.y, W, H); // first zoom-in creates the zoomed state
    const focus = pixelToChart(vp, anchor.x, anchor.y, W, H);
    vp = zoomAt(vp, 0.5, anchor.x, anchor.y, W, H); // zoom in again within the zoomed state
    const back = chartToPixel(vp, focus.t, focus.w, W, H);
    expect(back.x).toBeCloseTo(anchor.x, 6);
    expect(back.y).toBeCloseTo(anchor.y, 6);
  });
});

describe('panBy', () => {
  it('clamps to envelope with 10 % margin', () => {
    const vp = panBy(makeViewport(), -1000, 1000);
    expect(vp.tmin).toBeGreaterThanOrEqual(ENVELOPE.tmin - 0.1 * (ENVELOPE.tmax - ENVELOPE.tmin));
    expect(vp.wmax).toBeLessThanOrEqual(ENVELOPE.wmax * 1.1);
  });
});
