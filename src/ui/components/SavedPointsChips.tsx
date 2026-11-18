// src/ui/components/SavedPointsChips.tsx
import { useCurrent } from '../../state/current';
import { usePoints } from '../../state/points';

export function SavedPointsChips() {
  const points = usePoints((s) => s.points);
  const remove = usePoints((s) => s.remove);
  const setProbe = useCurrent((s) => s.setProbe);
  if (points.length === 0) return null;
  return (
    <div className="chip-row">
      {points.map((pt) => (
        <button
          key={pt.id}
          className="chip"
          onClick={() => setProbe(pt.state)}
          onContextMenu={(e) => {
            e.preventDefault();
            if (window.confirm(`Delete "${pt.label}"?`)) remove(pt.id);
          }}
        >
          {pt.label}
        </button>
      ))}
    </div>
  );
}
