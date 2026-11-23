import { CalendarCheck, LineChart, Map, Settings } from 'lucide-react';

/**
 * The app's four destinations, in the order they appear in the tab bar.
 *
 * Today comes first because it is the daily habit; the map is where a sore
 * starts, and most days nothing starts. A bottom bar stops being scannable
 * past five, and anything that is not somewhere you *go* — sign out, theme —
 * belongs in Settings rather than competing with them.
 *
 * The visible label is each tab's whole accessible name. A longer spoken
 * name ("Patterns and readings over time") broke voice control: saying
 * "Insights" matched nothing (WCAG 2.5.3, label in name).
 */
export const APP_NAV = [
  {
    href: '/today',
    label: 'Today',
    icon: CalendarCheck
  },
  {
    href: '/my-sores',
    label: 'Map',
    icon: Map
  },
  {
    href: '/insights',
    label: 'Insights',
    icon: LineChart
  },
  {
    href: '/profile',
    label: 'Settings',
    icon: Settings
  }
] as const;

/** Settings has sub-pages, so an exact match would unhighlight the tab. */
export const isActiveTab = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);
