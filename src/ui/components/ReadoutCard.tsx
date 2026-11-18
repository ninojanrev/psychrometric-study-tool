import { useCurrent } from '../../state/current';
import { usePoints } from '../../state/points';
import { useSettings } from '../../state/settings';
import { fmtState } from '../format';

export function ReadoutCard() {
  const probe = useCurrent((s) => s.probe);
  const probeIsFog = useCurrent((s) => s.probeIsFog);
  const setOpenSheet = useCurrent((s) => s.setOpenSheet);
  const unitSystem = useSettings((s) => s.unitSystem);
  const addPoint = usePoints((s) => s.add);
  if (!probe) return null;
  const values = fmtState(probe, unitSystem);
  return (
    <div className="readout-card">
      <b>Probed point</b>
      {probeIsFog && <div className="fog-warning">Fog region — this air holds more moisture than 100 % RH.</div>}
      <div className="readout-values">
        {values.map((v) => (
          <div key={v.key}>
            <div className="k">{v.key}</div>
            <div className="v">{v.value}</div>
          </div>
        ))}
      </div>
      <div className="readout-actions">
        <button className="btn" onClick={() => setOpenSheet('calculator')}>Calculator</button>
        <button className="btn secondary" onClick={() => setOpenSheet('converter')}>Convert</button>
        <button
          className="btn secondary"
          onClick={() => {
            const label = window.prompt('Label this point', 'Point');
            if (label) addPoint(label, probe);
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
