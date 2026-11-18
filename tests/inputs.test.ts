// tests/inputs.test.ts
import { describe, expect, it } from 'vitest';
import { pushEdit } from '../src/state/inputs';

describe('pushEdit rolling-pair rule', () => {
  it('keeps the two most recently edited properties', () => {
    expect(pushEdit(['tdb', 'rh'], 'twb')).toEqual(['rh', 'twb']);
  });
  it('re-editing a property moves it to the end', () => {
    expect(pushEdit(['rh', 'twb'], 'rh')).toEqual(['twb', 'rh']);
  });
});
