import { FlatCompat } from '@eslint/eslintrc';

// eslint-config-next 15.x still ships eslintrc-style configs; FlatCompat bridges them.
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['.next/**', 'next-env.d.ts', 'out/**']
  }
];

export default config;
