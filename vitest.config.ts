import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Unit tests only: the pure helpers under utils/, and the plain data modules
 * that sit beside components. Components themselves are exercised in the
 * browser, not here, so there is no DOM environment to set up — which is why
 * the glob takes `.test.ts` and never `.test.tsx`.
 */
export default defineConfig({
  test: {
    include: ['utils/**/*.test.ts', 'components/**/*.test.ts']
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url))
    }
  }
});
