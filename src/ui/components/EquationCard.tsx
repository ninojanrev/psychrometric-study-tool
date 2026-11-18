import { equationsFor } from '../../math/explain';
import type { AirState } from '../../math/types';
import { useState } from 'react';

export function EquationCard({ state }: { state: AirState | null }) {
  const [open, setOpen] = useState(false);
  if (!state) return null;
  return (
    <div>
      <button className="btn secondary" onClick={() => setOpen(!open)}>
        {open ? 'Hide equations' : 'Show equations'}
      </button>
      {open && equationsFor(state).map((eq) => (
        <div key={eq.title}>
          <div className="status-line"><b>{eq.title}</b></div>
          <div className="equation">{eq.text}</div>
        </div>
      ))}
    </div>
  );
}
