import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom has no ResizeObserver; ChartScreen's mount effect constructs one.
if (!('ResizeObserver' in globalThis)) {
  Object.defineProperty(globalThis, 'ResizeObserver', {
    value: class { observe() {} unobserve() {} disconnect() {} },
    writable: true,
    configurable: true,
  });
}

// jsdom implements getContext() as "not implemented" (virtual-console noise)
// yet returns null, which is all ChartScreen's draw effect relies on. Keep the
// null-return semantics, skip the noise.
HTMLCanvasElement.prototype.getContext = () => null;

// Vitest runs with globals:false, so @testing-library/react's auto-cleanup
// never registers; unmount rendered components between tests.
afterEach(() => { cleanup(); });
