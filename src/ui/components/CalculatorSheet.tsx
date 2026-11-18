import { useState } from 'react';
import { solveState, SolveError } from '../../math/solve';
import type { AirState, PropertyName } from '../../math/types';
import { convert, type UnitSystem } from '../../math/units';
import { pushEdit } from '../../state/inputs';
import { effectivePressure, useSettings } from '../../state/settings';
import { useCurrent } from '../../state/current';
import { EquationCard } from './EquationCard';

const PROPS: PropertyName[] = ['tdb', 'twb', 'tdp', 'rh', 'w', 'h', 'v'];

const LABELS: Record<PropertyName, string> = {
  tdb: 'Dry-bulb', twb: 'Wet-bulb', tdp: 'Dew point',
  rh: 'Relative humidity', w: 'Humidity ratio', h: 'Enthalpy', v: 'Spec. volume',
};

function unitSuffix(p: PropertyName, sys: UnitSystem): string {
  switch (p) {
    case 'tdb': return sys === 'si' ? '°C' : '°F';
    case 'twb': return sys === 'si' ? '°C' : '°F';
    case 'tdp': return sys === 'si' ? '°C' : '°F';
    case 'rh': return '%';
    case 'w': return sys === 'si' ? 'kg/kg' : 'lb/lb';
    case 'h': return sys === 'si' ? 'kJ/kg' : 'Btu/lb';
    case 'v': return sys === 'si' ? 'm³/kg' : 'ft³/lb';
  }
}

const DIGITS: Record<PropertyName, number> = {
  tdb: 1, twb: 1, tdp: 1, rh: 1, w: 5, h: 1, v: 3,
};

// Display value of a property in the user's unit system
function display(p: PropertyName, si: number | undefined, sys: UnitSystem, digits: number): string {
  if (si === undefined || !Number.isFinite(si)) return '';
  if (p === 'rh') return (si * 100).toFixed(digits);
  return convert(unitQuantityOf(p), si, 'si', sys).toFixed(digits);
}

function unitQuantityOf(p: PropertyName) {
  return p === 'rh' ? 'tdb' : p; // rh needs no conversion; quantity type is irrelevant
}

// Parse a user-typed display value back to SI
function parseInput(p: PropertyName, raw: string, sys: UnitSystem): number | undefined {
  const v = Number(raw);
  if (!Number.isFinite(v)) return undefined;
  if (p === 'rh') return v / 100;
  return convert(unitQuantityOf(p), v, sys, 'si');
}

export function CalculatorSheet() {
  const settings = useSettings();
  const activePair = useCurrent((s) => s.activePair);
  const setActivePair = useCurrent((s) => s.setActivePair);
  const setProbe = useCurrent((s) => s.setProbe);
  const [typed, setTyped] = useState<Partial<Record<PropertyName, string>>>({});
  const [result, setResult] = useState<AirState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recompute = (pair: [PropertyName, PropertyName], t: Partial<Record<PropertyName, string>>, sys: UnitSystem) => {
    const [a, b] = pair;
    const va = parseInput(a, t[a] ?? '', sys);
    const vb = parseInput(b, t[b] ?? '', sys);
    if (va === undefined || vb === undefined) { setResult(null); setError(null); return; }
    try {
      // read pressure from the store, not the render closure — altitude changes
      // update the store after this component last rendered
      const st = solveState(a, va, b, vb, effectivePressure(useSettings.getState()));
      setResult(st);
      setError(null);
      setProbe(st);
    } catch (e) {
      setResult(null);
      setError(e instanceof SolveError ? e.message : 'Could not solve these values.');
      setProbe(null);
    }
  };

  const onEdit = (p: PropertyName, raw: string) => {
    const nextTyped = { ...typed, [p]: raw };
    const nextPair = pushEdit(activePair, p);
    setTyped(nextTyped);
    setActivePair(nextPair);
    recompute(nextPair, nextTyped, settings.unitSystem);
  };

  const sys = settings.unitSystem;
  const altDisplay = convert('altitude', settings.altitudeM, 'si', sys).toFixed(0);
  const altUnit = sys === 'si' ? 'm' : 'ft';

  return (
    <div>
      <h2>Calculator</h2>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="calc-alt">Altitude ({altUnit})</label>
          <input
            id="calc-alt" type="number" value={altDisplay}
            onChange={(e) => {
              const m = convert('altitude', Number(e.target.value) || 0, sys, 'si');
              useSettings.getState().setAltitudeM(m);
              recompute(activePair, typed, sys);
            }}
          />
        </div>
      </div>
      <div className="field-grid">
        {PROPS.map((prop) => {
          const isInput = activePair.includes(prop) && typed[prop] !== undefined;
          const shown = isInput
            ? typed[prop]
            : display(prop, result ? result[prop] : undefined, sys, DIGITS[prop]);
          return (
            <div className="field" key={prop}>
              <label htmlFor={`calc-${prop}`}>{LABELS[prop]} ({unitSuffix(prop, sys)})</label>
              <input
                id={`calc-${prop}`}
                type="number"
                inputMode="decimal"
                value={shown}
                readOnly={!isInput}
                onChange={(e) => onEdit(prop, e.target.value)}
              />
            </div>
          );
        })}
      </div>
      <div className="status-line">
        Inputs: {LABELS[activePair[0]]} ({unitSuffix(activePair[0], sys)}) + {LABELS[activePair[1]]} ({unitSuffix(activePair[1], sys)})
        {' '}— the two fields you edited last are the inputs.
      </div>
      {error && <div className="error-line" role="alert">{error}</div>}
      <EquationCard state={result} />
    </div>
  );
}
