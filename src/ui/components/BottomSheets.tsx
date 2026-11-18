import type { ReactNode } from 'react';
import { useCurrent } from '../../state/current';

export function BottomSheets({ calculator, converter, bookmarks, settings }: {
  calculator: ReactNode;
  converter: ReactNode;
  bookmarks: ReactNode;
  settings: ReactNode;
}) {
  const openSheet = useCurrent((s) => s.openSheet);
  const setOpenSheet = useCurrent((s) => s.setOpenSheet);
  if (!openSheet) return null;
  const content = openSheet === 'calculator' ? calculator
    : openSheet === 'converter' ? converter
    : openSheet === 'bookmarks' ? bookmarks
    : settings;
  if (!content) return null;
  return (
    <div className="sheet-backdrop" onClick={() => setOpenSheet(null)}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>{content}</div>
    </div>
  );
}
