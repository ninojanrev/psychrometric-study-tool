import type { PropertyName } from '../math/types';

// The two most recently edited properties are the calculator's inputs (spec §6).
// Re-editing the current newest member keeps the pair stable (per-keystroke typing
// edits one field repeatedly); editing the older member swaps it to the newest slot.
export function pushEdit(
  pair: [PropertyName, PropertyName], edited: PropertyName,
): [PropertyName, PropertyName] {
  return edited === pair[1] ? [pair[0], edited] : [pair[1], edited];
}
