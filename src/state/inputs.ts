import type { PropertyName } from '../math/types';

// The two most recently edited properties are the calculator's inputs (spec §6)
export function pushEdit(
  pair: [PropertyName, PropertyName], edited: PropertyName,
): [PropertyName, PropertyName] {
  return [pair[1], edited];
}
