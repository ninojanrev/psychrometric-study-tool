import { useEffect, useRef, useState } from 'react';
import { probeAt } from '../../chart/probe';
import { drawChart, chartColors } from '../../chart/families/draw';
import { attachGestures } from '../../chart/engine';
import { makeViewport, type Viewport } from '../../chart/viewport';
import { effectivePressure, useSettings } from '../../state/settings';
import { useCurrent } from '../../state/current';
import { usePoints } from '../../state/points';
import { ReadoutCard } from '../components/ReadoutCard';
import { SavedPointsChips } from '../components/SavedPointsChips';
import { BottomSheets } from '../components/BottomSheets';
import { CalculatorSheet } from '../components/CalculatorSheet';
import { ConverterSheet } from '../components/ConverterSheet';
import { SettingsSheet } from '../components/SettingsSheet';

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

  // Redraw when the theme flips (chartColors() reads CSS custom properties).
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => redraw();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <div className="chart-screen">
      <button className="gear-btn" aria-label="Settings" onClick={() => useCurrent.getState().setOpenSheet('settings')}>⚙</button>
      <canvas ref={canvasRef} role="presentation" />
      <SavedPointsChips />
      <ReadoutCard />
      {storageFailed && (
        <div className="storage-warning" role="alert">
          Storage unavailable — saved points will last only for this session.
        </div>
      )}
      <BottomSheets
        calculator={<CalculatorSheet />}
        converter={<ConverterSheet />}
        settings={<SettingsSheet />}
      />
    </div>
  );
}
