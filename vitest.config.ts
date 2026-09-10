import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Unit tests only: the pure helpers under utils/. Components are exercised
 * in the browser, not here, so there is no DOM environment to set up.
 */
export default defineConfig({
  test: {
    include: ['utils/**/*.test.ts']
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url))
    }
  }
});
