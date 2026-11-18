// tests/viewport.test.ts
import { describe, expect, it } from 'vitest';
import { ENVELOPE, chartToPixel, makeViewport, panBy, pixelToChart, zoomAt } from '../src/chart/viewport';

const W = 400, H = 300;

describe('mapping', () => {
  it('maps envelope corners to canvas corners (y up in chart, down in pixels)', () => {
    const vp = makeViewport();
    const tl = chartToPixel(vp, ENVELOPE.tmin, ENVELOPE.wmax, W, H);
    const br = chartToPixel(vp, ENVELOPE.tmax, ENVELOPE.wmin, W, H);
    expect(tl).toEqual({ x: 0, y: 0 });
    expect(br).toEqual({ x: W, y: H });
  });
  it('pixel→chart→pixel round trips', () => {
    const vp = makeViewport();
    const { t, w } = pixelToChart(vp, 137, 91, W, H);
    expect(chartToPixel(vp, t, w, W, H)).toEqual({ x: 137, y: 91 });
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
