import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import './styles.css';
import { AuthProvider, useAuth } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { CACHE_BUSTER, persister, queryClient } from './lib/query-client';
import { router } from './router';
import { Splash } from './components/splash';

function App() {
  const auth = useAuth();

  // Route guards read auth from context; re-run them whenever it changes.
  // `router.invalidate()` re-runs every matched `beforeLoad`, so signing in on
  // /login and signing out on /settings both redirect without the screen
  // navigating itself.
  useEffect(() => {
    if (auth.session === undefined) return;
    // Cached rows belong to whoever was signed in; never show them to nobody.
    if (auth.session === null) queryClient.clear();
    void router.invalidate();
  }, [auth.session]);

  if (auth.session === undefined) return <Splash />;
  return <RouterProvider router={router} context={{ auth }} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          buster: CACHE_BUSTER,
          maxAge: 1000 * 60 * 60 * 24 * 7
        }}
        onSuccess={() => {
          void queryClient
            .resumePausedMutations()
            .then(() => queryClient.invalidateQueries());
        }}
      >
        <AuthProvider>
          <App />
        </AuthProvider>
      </PersistQueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
