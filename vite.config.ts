/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// The VitePWA plugin from vite-plugin-pwa is added here in Task 16
// (imported and wired into `plugins` at the same time to keep builds green).

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    passWithNoTests: true,
  },
});
