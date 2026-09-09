import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { Activity, CalendarDays, Plus, Settings, Smile, Sun } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@canker/ui';
import { useProfile } from '@/lib/data';
import { env } from '@/lib/env';
import { DemoBanner } from '@/components/demo-mode';

const TABS = [
  { to: '/today', label: 'Today', icon: Sun },
  { to: '/mouth', label: 'Mouth', icon: Smile },
  { to: '/insights', label: 'Insights', icon: Activity },
  { to: '/history', label: 'History', icon: CalendarDays }
] as const;

/**
 * Bottom tab bar on phones, left rail on wide screens. The same shell runs
 * inside the Capacitor WebView, so it respects safe-area insets.
 */
export function AppShell() {
  const profile = useProfile();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // First-run gate: send new users through onboarding once.
  useEffect(() => {
    if (
      profile.data &&
      profile.data.onboarded_at === null &&
      pathname !== '/onboarding' &&
      !pathname.startsWith('/sores/new')
    ) {
      void navigate({ to: '/onboarding', replace: true });
    }
  }, [profile.data, pathname, navigate]);

  const immersive = pathname === '/onboarding';

  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      {env.demo ? <DemoBanner /> : null}
      <div className="flex flex-1">
        {!immersive && (
          <nav
            aria-label="Primary"
            className="border-border bg-card sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r px-3 py-6 md:flex"
          >
            <Link
              to="/today"
              search={{}}
              className="font-display mb-8 px-3 text-xl font-bold"
            >
              Canker Core
            </Link>
            <div className="flex flex-col gap-1">
              {TABS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  search={{}}
                  className="text-secondary-foreground hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
                  activeProps={{
                    className: 'bg-accent-soft text-accent hover:bg-accent-soft'
                  }}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </Link>
              ))}
            </div>
            <Link
              to="/sores/new"
              search={{}}
              className="bg-accent text-primary-foreground mt-6 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:opacity-90"
            >
              <Plus className="h-4 w-4" aria-hidden /> New sore
            </Link>
            <div className="mt-auto">
              <Link
                to="/settings"
                className="text-secondary-foreground hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
                activeProps={{
                  className: 'bg-accent-soft text-accent hover:bg-accent-soft'
                }}
              >
                <Settings className="h-4 w-4" aria-hidden />
                Settings
              </Link>
            </div>
          </nav>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <main
            className={cn(
              'mx-auto w-full max-w-2xl flex-1 px-4 pt-[max(1rem,env(safe-area-inset-top))]',
              !immersive && 'pb-28 md:pb-8'
            )}
          >
            <Outlet />
          </main>

          {!immersive && (
            <nav
              aria-label="Primary"
              className="safe-bottom border-border bg-card/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden"
            >
              <div className="mx-auto grid max-w-2xl grid-cols-4">
                {TABS.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    search={{}}
                    className="text-muted-foreground flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium"
                    activeProps={{ className: 'text-accent' }}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                    {label}
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
