// src/ui/components/SettingsSheet.tsx
import { convert } from '../../math/units';
import { usePoints } from '../../state/points';
import { useSettings } from '../../state/settings';

export function SettingsSheet() {
  const settings = useSettings();
  const clear = usePoints((s) => s.clear);
  const sys = settings.unitSystem;
  const altUnit = sys === 'si' ? 'm' : 'ft';

  return (
    <div>
      <h2>Settings</h2>
      <div className="segmented">
        <button className={sys === 'si' ? 'active' : ''} onClick={() => settings.setUnitSystem('si')}>SI</button>
        <button className={sys === 'ip' ? 'active' : ''} onClick={() => settings.setUnitSystem('ip')}>IP</button>
      </div>
      <div className="field">
        <label htmlFor="set-alt">Default altitude ({altUnit})</label>
        <input
          id="set-alt" type="number" inputMode="decimal"
          value={convert('altitude', settings.altitudeM, 'si', sys).toFixed(0)}
          onChange={(e) => settings.setAltitudeM(convert('altitude', Number(e.target.value) || 0, sys, 'si'))}
        />
      </div>
      <div className="field">
        <label htmlFor="set-p">Pressure override ({sys === 'si' ? 'kPa' : 'inHg'}, empty = standard)</label>
        <input
          id="set-p" type="number" inputMode="decimal"
          value={settings.pressureOverrideKPa === null
            ? '' : convert('p', settings.pressureOverrideKPa, 'si', sys).toFixed(2)}
          onChange={(e) => {
            const raw = e.target.value.trim();
            settings.setPressureOverrideKPa(raw === '' ? null : convert('p', Number(raw), sys, 'si'));
          }}
        />
      </div>
      <button
        className="btn secondary"
        onClick={() => { if (window.confirm('Delete all saved points?')) clear(); }}
      >
        Reset saved points
      </button>
    </div>
  );
}
