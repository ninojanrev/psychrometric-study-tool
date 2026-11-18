// src/ui/components/ConverterSheet.tsx
import { useState } from 'react';
import { solveState, SolveError } from '../../math/solve';
import type { PropertyName } from '../../math/types';
import { convert, type UnitQuantity, type UnitSystem } from '../../math/units';
import { effectivePressure, useSettings } from '../../state/settings';

type Mode = 'units' | 'state' | 'altitude';

const QUANTITIES: { id: UnitQuantity; label: string }[] = [
  { id: 'tdb', label: 'Temperature (dry-bulb)' },
  { id: 'w', label: 'Humidity ratio' },
  { id: 'h', label: 'Enthalpy' },
  { id: 'v', label: 'Specific volume' },
  { id: 'p', label: 'Pressure' },
  { id: 'altitude', label: 'Altitude' },
];

const PROPS: { id: PropertyName; label: string }[] = [
  { id: 'rh', label: 'Relative humidity' },
  { id: 'twb', label: 'Wet-bulb' },
  { id: 'tdp', label: 'Dew point' },
  { id: 'w', label: 'Humidity ratio' },
  { id: 'h', label: 'Enthalpy' },
  { id: 'v', label: 'Specific volume' },
];

function quantityUnit(q: UnitQuantity, sys: UnitSystem): string {
  const si = sys === 'si';
  switch (q) {
    case 'tdb': case 'twb': case 'tdp': return si ? '°C' : '°F';
    case 'w': return 'kg/kg';
    case 'h': return si ? 'kJ/kg' : 'Btu/lb';
    case 'v': return si ? 'm³/kg' : 'ft³/lb';
    case 'p': case 'pv': return si ? 'kPa' : 'inHg';
    case 'altitude': return si ? 'm' : 'ft';
  }
}

function propUnit(p: PropertyName, sys: UnitSystem): string {
  if (p === 'rh') return '%';
  return quantityUnit(p as UnitQuantity, sys);
}

export function ConverterSheet() {
  const settings = useSettings();
  const sys = settings.unitSystem;
  const [mode, setMode] = useState<Mode>('units');
  const [quantity, setQuantity] = useState<UnitQuantity>('tdb');
  const [raw, setRaw] = useState('');
  const [side, setSide] = useState<'si' | 'ip'>('si');
  const [tdb, setTdb] = useState('25');
  const [prop, setProp] = useState<PropertyName>('rh');
  const [propValue, setPropValue] = useState('');
  const [altitude, setAltitude] = useState('0');

  const temp = sys === 'si' ? '°C' : '°F';
  const n = Number(raw);
  const valid = raw !== '' && Number.isFinite(n);
  const siVal = valid ? (side === 'si' ? n : convert(quantity, n, 'ip', 'si')) : null;
  const ipVal = valid ? (side === 'ip' ? n : convert(quantity, n, 'si', 'ip')) : null;

  // derived from the typed inputs, so every field change re-solves automatically
  const equiv = (() => {
    if (propValue === '') return null;
    const siTdb = convert('tdb', Number(tdb), sys, 'si');
    const val = Number(propValue);
    if (!Number.isFinite(siTdb) || !Number.isFinite(val)) return null;
    const siVal2 = prop === 'rh' ? val / 100 : convert(prop as UnitQuantity, val, sys, 'si');
    try {
      const st = solveState('tdb', siTdb, prop, siVal2, effectivePressure(settings));
      return {
        ok: true as const,
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
      return { ok: false as const, error: err instanceof SolveError ? err.message : 'Could not solve these values.' };
    }
  })();

  return (
    <div>
      <h2>Converter</h2>
      <div className="segmented">
        {(['units', 'state', 'altitude'] as Mode[]).map((m) => (
          <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
            {m === 'units' ? 'Units' : m === 'state' ? 'Air state' : 'Altitude ↔ P'}
          </button>
        ))}
      </div>

      {mode === 'units' && (
        <div>
          <div className="field">
            <label htmlFor="conv-q">Quantity</label>
            <select
              id="conv-q" value={quantity}
              onChange={(e) => { setQuantity(e.target.value as UnitQuantity); setRaw(''); }}
            >
              {QUANTITIES.map((q) => <option key={q.id} value={q.id}>{q.label}</option>)}
            </select>
          </div>
          <p className="status-line">Type in either box — the other side updates.</p>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="conv-si">SI ({quantityUnit(quantity, 'si')})</label>
              <input
                id="conv-si" type="number" inputMode="decimal"
                value={side === 'si' ? raw : siVal !== null ? siVal.toFixed(4) : ''}
                onChange={(e) => { setSide('si'); setRaw(e.target.value); }}
              />
            </div>
            <div className="field">
              <label htmlFor="conv-ip">IP ({quantityUnit(quantity, 'ip')})</label>
              <input
                id="conv-ip" type="number" inputMode="decimal"
                value={side === 'ip' ? raw : ipVal !== null ? ipVal.toFixed(4) : ''}
                onChange={(e) => { setSide('ip'); setRaw(e.target.value); }}
              />
            </div>
          </div>
        </div>
      )}

      {mode === 'state' && (
        <div>
          <p className="status-line">Enter a dry-bulb temperature and one other property — every value at that air state is listed.</p>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="conv-tdb">Dry-bulb ({temp})</label>
              <input id="conv-tdb" type="number" inputMode="decimal" value={tdb} onChange={(e) => setTdb(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="conv-prop">Known property</label>
              <select id="conv-prop" value={prop} onChange={(e) => setProp(e.target.value as PropertyName)}>
                {PROPS.map((p) => <option key={p.id} value={p.id}>{p.label} ({propUnit(p.id, sys)})</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="conv-pv">Value ({propUnit(prop, sys)})</label>
            <input id="conv-pv" type="number" inputMode="decimal" value={propValue} onChange={(e) => setPropValue(e.target.value)} />
          </div>
          {equiv && !equiv.ok && <div className="error-line" role="alert">{equiv.error}</div>}
          {equiv && equiv.ok && (
            <div>
              <p className="status-line">All properties at this state:</p>
              <div className="equation">
                {Object.entries(equiv.table).map(([k, v]) => `${k}: ${v}`).join('\n')}
              </div>
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
