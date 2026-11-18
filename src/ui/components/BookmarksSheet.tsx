// src/ui/components/BookmarksSheet.tsx
import { useCurrent } from '../../state/current';
import { usePoints } from '../../state/points';
import { useSettings } from '../../state/settings';
import { fmtState } from '../format';

export function BookmarksSheet() {
  const points = usePoints((s) => s.points);
  const remove = usePoints((s) => s.remove);
  const setProbe = useCurrent((s) => s.setProbe);
  const requestNav = useCurrent((s) => s.requestNav);
  const unitSystem = useSettings((s) => s.unitSystem);

  if (points.length === 0) {
    return (
      <div>
        <h2>Bookmarks</h2>
        <p className="status-line">
          No saved points yet — long-press the chart, or probe a point and tap the ＋ button.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Bookmarks</h2>
      <ul className="bookmark-list">
        {points.map((pt) => {
          const values = fmtState(pt.state, unitSystem);
          const db = values[0];
          const rh = values[1];
          return (
            <li key={pt.id} className="bookmark-row">
              <button
                className="bookmark-go"
                onClick={() => {
                  setProbe(pt.state);
                  requestNav(pt.state.tdb, pt.state.w);
                }}
              >
                <span className="bookmark-label">{pt.label}</span>
                <span className="bookmark-sub">{db.key} {db.value} · {rh.key} {rh.value}</span>
              </button>
              <button
                className="icon-btn small"
                aria-label={`Delete ${pt.label}`}
                onClick={() => {
                  if (window.confirm(`Delete "${pt.label}"?`)) remove(pt.id);
                }}
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
