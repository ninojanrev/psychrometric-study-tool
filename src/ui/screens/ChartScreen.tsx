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

export function ChartScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vpRef = useRef<Viewport>(makeViewport());
  const [, setTick] = useState(0);
  const redraw = () => setTick((t) => t + 1);

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
    const s = useSettings.getState();
    drawChart(ctx, vpRef.current, canvas.clientWidth, canvas.clientHeight, effectivePressure(s), {
      probe: useCurrent.getState().probe,
      points: usePoints.getState().points,
      colors: chartColors(),
    });
  });

  return (
    <div className="chart-screen">
      <button className="gear-btn" aria-label="Settings" onClick={() => useCurrent.getState().setOpenSheet('settings')}>⚙</button>
      <canvas ref={canvasRef} role="presentation" />
      <SavedPointsChips />
      <ReadoutCard />
      <BottomSheets
        calculator={<CalculatorSheet />}
        converter={<ConverterSheet />}
        settings={null}
      />
    </div>
  );
}
