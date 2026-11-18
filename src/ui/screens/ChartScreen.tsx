import { useEffect, useRef, useState } from 'react';
import { probeAt } from '../../chart/probe';
import { drawChart, chartColors } from '../../chart/families/draw';
import { attachGestures } from '../../chart/engine';
import { centerOn, chartToPixel, makeViewport, type Viewport } from '../../chart/viewport';
import { effectivePressure, useSettings } from '../../state/settings';
import { useCurrent } from '../../state/current';
import { usePoints } from '../../state/points';
import { ReadoutCard } from '../components/ReadoutCard';
import { SavedPointsChips } from '../components/SavedPointsChips';
import { BottomSheets } from '../components/BottomSheets';
import { BookmarksSheet } from '../components/BookmarksSheet';
import { CalculatorSheet } from '../components/CalculatorSheet';
import { ConverterSheet } from '../components/ConverterSheet';
import { SettingsSheet } from '../components/SettingsSheet';

const ICON_STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function CalculatorIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...ICON_STROKE}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <line x1="8.5" y1="7.5" x2="15.5" y2="7.5" />
      <line x1="9" y1="12" x2="9" y2="12.01" strokeWidth="2.6" />
      <line x1="12" y1="12" x2="12" y2="12.01" strokeWidth="2.6" />
      <line x1="15" y1="12" x2="15" y2="12.01" strokeWidth="2.6" />
      <line x1="9" y1="16" x2="9" y2="16.01" strokeWidth="2.6" />
      <line x1="12" y1="16" x2="12" y2="16.01" strokeWidth="2.6" />
      <line x1="15" y1="16" x2="15" y2="16.01" strokeWidth="2.6" />
    </svg>
  );
}

function ConverterIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...ICON_STROKE}>
      <path d="M4 8h13" />
      <path d="M14 5l3 3-3 3" />
      <path d="M20 16H7" />
      <path d="M10 13l-3 3 3 3" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...ICON_STROKE}>
      <path d="M7 4h10a1 1 0 011 1v16l-6-4.2L6 21V5a1 1 0 011-1z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96a7.03 7.03 0 00-1.62-.94l-.36-2.54a.48.48 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 00-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z" />
    </svg>
  );
}

function BookmarkPlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...ICON_STROKE}>
      <path d="M7 4h10a1 1 0 011 1v16l-6-4.2L6 21V5a1 1 0 011-1z" />
      <line x1="12" y1="8.5" x2="12" y2="13.5" />
      <line x1="9.5" y1="11" x2="14.5" y2="11" />
    </svg>
  );
}

const TAP_CLEAR_PX = 26;

export function ChartScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vpRef = useRef<Viewport>(makeViewport());
  const [, setTick] = useState(0);
  const redraw = () => setTick((t) => t + 1);
  // Subscribing re-renders on store changes, so the no-deps draw effect below
  // re-runs with fresh snapshots — without this the canvas goes stale.
  const probe = useCurrent((s) => s.probe);
  const points = usePoints((s) => s.points);
  const storageFailed = usePoints((s) => s.storageFailed);
  const navRequest = useCurrent((s) => s.navRequest);
  const altitudeM = useSettings((s) => s.altitudeM);
  const pressureOverrideKPa = useSettings((s) => s.pressureOverrideKPa);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      redraw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const detach = attachGestures(canvas, {
      getViewport: () => vpRef.current,
      setViewport: (vp) => { vpRef.current = vp; redraw(); },
      onTap: (x, y) => {
        // Tapping the probed crosshair again deselects it.
        const cur = useCurrent.getState().probe;
        if (cur) {
          const px = chartToPixel(vpRef.current, cur.tdb, cur.w, canvas.clientWidth, canvas.clientHeight);
          if (Math.hypot(x - px.x, y - px.y) <= TAP_CLEAR_PX) {
            useCurrent.getState().setProbe(null);
            return;
          }
        }
        const s = useSettings.getState();
        const st = probeAt(vpRef.current, x, y, canvas.clientWidth, canvas.clientHeight, effectivePressure(s));
        useCurrent.getState().setProbe(st);
      },
      onDoubleTap: () => {
        vpRef.current = makeViewport();
        redraw();
      },
      onLongPress: (x, y) => {
        const s = useSettings.getState();
        const st = probeAt(vpRef.current, x, y, canvas.clientWidth, canvas.clientHeight, effectivePressure(s));
        useCurrent.getState().setProbe(st);
        const label = window.prompt('Label this point', 'Point');
        if (label) usePoints.getState().add(label, st);
      },
    });
    return () => { ro.disconnect(); detach(); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawChart(ctx, vpRef.current, canvas.clientWidth, canvas.clientHeight, effectivePressure({ altitudeM, pressureOverrideKPa }), {
      probe,
      points,
      colors: chartColors(),
    });
  });

  // Fly to a bookmarked point (Bookmarks sheet → Go, chips keep probe-only behavior)
  useEffect(() => {
    if (!navRequest) return;
    vpRef.current = centerOn(vpRef.current, navRequest.t, navRequest.w);
    redraw();
  }, [navRequest]);

  // Redraw when the theme flips (chartColors() reads CSS custom properties).
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => redraw();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const dockVisible = probe !== null || points.length > 0;

  return (
    <div className="chart-screen">
      <header className="app-bar">
        <span className="app-title">Psychrometric Study Tool</span>
        <div className="app-bar-actions">
          <button className="icon-btn" aria-label="Calculator" onClick={() => useCurrent.getState().setOpenSheet('calculator')}><CalculatorIcon /></button>
          <button className="icon-btn" aria-label="Converter" onClick={() => useCurrent.getState().setOpenSheet('converter')}><ConverterIcon /></button>
          <button className="icon-btn" aria-label="Bookmarks" onClick={() => useCurrent.getState().setOpenSheet('bookmarks')}><BookmarkIcon /></button>
          <button className="icon-btn" aria-label="Settings" onClick={() => useCurrent.getState().setOpenSheet('settings')}><SettingsIcon /></button>
        </div>
      </header>
      <div className="chart-area">
        <canvas ref={canvasRef} role="presentation" />
        {storageFailed && (
          <div className="storage-warning" role="alert">
            Storage unavailable — saved points will last only for this session.
          </div>
        )}
        <div className={`dock${dockVisible ? ' dock-visible' : ''}`}>
          {probe && (
            <button
              className="fab"
              aria-label="Save probed point"
              onClick={() => {
                const label = window.prompt('Label this point', 'Point');
                if (label) usePoints.getState().add(label, probe);
              }}
            >
              <BookmarkPlusIcon />
            </button>
          )}
          <SavedPointsChips />
          <ReadoutCard />
        </div>
      </div>
      <BottomSheets
        calculator={<CalculatorSheet />}
        converter={<ConverterSheet />}
        bookmarks={<BookmarksSheet />}
        settings={<SettingsSheet />}
      />
    </div>
  );
}
