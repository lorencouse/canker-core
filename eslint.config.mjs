import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier/flat';

export default defineConfig([
  ...nextVitals,
  prettier,
  // `next lint` skipped these implicitly; plain `eslint .` does not. The
  // native projects hold web bundles copied in by `cap sync`.
  globalIgnores([
    '.next/**',
    'next-env.d.ts',
    'ios/**',
    'android/**',
    'backups/**'
  ])
]);
