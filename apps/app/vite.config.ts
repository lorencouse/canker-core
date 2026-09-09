import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The same build is served at app.cankercore.com and copied into the
// Capacitor shell, so everything must be relative-path safe and static.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Mirrors the `@/*` path in tsconfig.json. Vite resolves '/src' from the project root.
    alias: { '@': '/src' }
  },
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Vendor code changes rarely; split it so app updates stay small downloads.
        manualChunks: {
          react: ['react', 'react-dom'],
          tanstack: ['@tanstack/react-router', '@tanstack/react-query', '@tanstack/react-query-persist-client'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
});
