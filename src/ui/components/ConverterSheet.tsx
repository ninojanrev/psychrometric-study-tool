// src/ui/components/ConverterSheet.tsx
import { useMemo, useState } from 'react';
import { solveState, SolveError } from '../../math/solve';
import type { PropertyName } from '../../math/types';
import { convert, type UnitQuantity } from '../../math/units';
import { effectivePressure, useSettings } from '../../state/settings';

type Mode = 'units' | 'equivalents' | 'altitude';

const QUANTITIES: { id: UnitQuantity; label: string }[] = [
  { id: 'tdb', label: 'Temperature (dry-bulb)' },
  { id: 'w', label: 'Humidity ratio' },
  { id: 'h', label: 'Enthalpy' },
  { id: 'v', label: 'Specific volume' },
  { id: 'p', label: 'Pressure' },
  { id: 'altitude', label: 'Altitude' },
];

const PROPS: { id: PropertyName; label: string }[] = [
  { id: 'rh', label: 'Relative humidity (%)' },
  { id: 'twb', label: 'Wet-bulb' },
  { id: 'tdp', label: 'Dew point' },
  { id: 'w', label: 'Humidity ratio (kg/kg)' },
  { id: 'h', label: 'Enthalpy (kJ/kg)' },
  { id: 'v', label: 'Specific volume (m³/kg)' },
];

export function ConverterSheet() {
  const settings = useSettings();
  const sys = settings.unitSystem;
  const [mode, setMode] = useState<Mode>('units');
  const [quantity, setQuantity] = useState<UnitQuantity>('tdb');
  const [value, setValue] = useState('');
  const [tdb, setTdb] = useState('25');
  const [prop, setProp] = useState<PropertyName>('rh');
  const [propValue, setPropValue] = useState('');
  const [altitude, setAltitude] = useState('0');

  const temp = sys === 'si' ? '°C' : '°F';
  const n = Number(value);
  const unitsResult = value !== '' && Number.isFinite(n)
    ? {
        si: sys === 'si' ? n : convert(quantity, n, 'ip', 'si'),
        ip: sys === 'ip' ? n : convert(quantity, n, 'si', 'ip'),
      }
    : null;

  // derived from the typed inputs, so every field change re-solves automatically
  const equiv = useMemo<{ table: Record<string, string> } | { error: string } | null>(() => {
    if (propValue === '') return null;
    const siTdb = convert('tdb', Number(tdb), sys, 'si');
    const val = Number(propValue);
    if (!Number.isFinite(siTdb) || !Number.isFinite(val)) return null;
    const siVal = prop === 'rh' ? val / 100 : convert(prop as UnitQuantity, val, sys, 'si');
    try {
      const st = solveState('tdb', siTdb, prop, siVal, effectivePressure(settings));
      return {
        table: {
          'Dry-bulb': `${convert('tdb', st.tdb, 'si', sys).toFixed(1)} ${temp}`,
          'Wet-bulb': `${convert('twb', st.twb, 'si', sys).toFixed(1)} ${temp}`,
          'Dew point': `${convert('tdp', st.tdp, 'si', sys).toFixed(1)} ${temp}`,
          'Humidity ratio': `${st.w.toFixed(5)} kg/kg`,
          'Enthalpy': `${convert('h', st.h, 'si', sys).toFixed(1)} ${sys === 'si' ? 'kJ/kg' : 'Btu/lb'}`,
          'Specific volume': `${convert('v', st.v, 'si', sys).toFixed(3)} ${sys === 'si' ? 'm³/kg' : 'ft³/lb'}`,
          'Rel. humidity': `${(st.rh * 100).toFixed(1)} %`,
        },
      };
    } catch (err) {
      return { error: err instanceof SolveError ? err.message : 'Could not solve these values.' };
    }
  }, [tdb, prop, propValue, sys, settings, temp]);

  return (
    <div>
      <h2>Converter</h2>
      <div className="segmented">
        {(['units', 'equivalents', 'altitude'] as Mode[]).map((m) => (
          <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
            {m === 'units' ? 'Units' : m === 'equivalents' ? 'Equivalents' : 'Altitude ↔ P'}
          </button>
        ))}
      </div>

      {mode === 'units' && (
        <div>
          <div className="field">
            <label htmlFor="conv-q">Quantity</label>
            <select id="conv-q" value={quantity} onChange={(e) => { setQuantity(e.target.value as UnitQuantity); setValue(''); }}>
              {QUANTITIES.map((q) => <option key={q.id} value={q.id}>{q.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="conv-v">Value ({sys === 'si' ? 'SI' : 'IP'})</label>
            <input id="conv-v" type="number" inputMode="decimal" value={value}
              onChange={(e) => setValue(e.target.value)} />
          </div>
          {unitsResult && (
            <div className="equation">
              SI: {unitsResult.si.toFixed(4)}{' → '}IP: {unitsResult.ip.toFixed(4)}
            </div>
          )}
        </div>
      )}

      {mode === 'equivalents' && (
        <div>
          <div className="field">
            <label htmlFor="conv-tdb">Dry-bulb ({temp})</label>
            <input id="conv-tdb" type="number" inputMode="decimal" value={tdb} onChange={(e) => setTdb(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="conv-prop">Property</label>
            <select id="conv-prop" value={prop} onChange={(e) => setProp(e.target.value as PropertyName)}>
              {PROPS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="conv-pv">Value</label>
            <input id="conv-pv" type="number" inputMode="decimal" value={propValue} onChange={(e) => setPropValue(e.target.value)} />
          </div>
          {equiv && 'error' in equiv && <div className="error-line" role="alert">{equiv.error}</div>}
          {equiv && 'table' in equiv && (
            <div className="equation">
              {Object.entries(equiv.table).map(([k, v]) => `${k}: ${v}`).join('\n')}
            </div>
          )}
        </div>
      )}

      {mode === 'altitude' && (
        <div>
          <div className="field">
            <label htmlFor="conv-alt">Altitude ({sys === 'si' ? 'm' : 'ft'})</label>
            <input id="conv-alt" type="number" inputMode="decimal" value={altitude} onChange={(e) => setAltitude(e.target.value)} />
          </div>
          {Number.isFinite(Number(altitude)) && (
            <div className="equation">
              Barometric pressure ≈ {convert('p', effectivePressure({
                altitudeM: convert('altitude', Number(altitude), sys, 'si'),
                pressureOverrideKPa: null,
              }), 'si', sys).toFixed(2)} {sys === 'si' ? 'kPa' : 'inHg'}
              {'\n'}(standard atmosphere; override it in Settings)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
