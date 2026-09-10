import { LineChart, Map, Settings } from 'lucide-react';

/**
 * The app's three destinations, in the order they appear in the tab bar.
 *
 * Three is deliberate. A bottom bar stops being scannable past five, and
 * anything that is not somewhere you *go* — sign out, theme — belongs in
 * Settings rather than competing with them.
 */
export const APP_NAV = [
  {
    href: '/my-sores',
    label: 'Map',
    // Spoken by a screen reader in place of the terse visual label.
    description: 'Your mouth map',
    icon: Map
  },
  {
    href: '/history',
    label: 'History',
    description: 'Readings over time',
    icon: LineChart
  },
  {
    href: '/profile',
    label: 'Settings',
    description: 'Account and preferences',
    icon: Settings
  }
] as const;

/** Settings has sub-pages, so an exact match would unhighlight the tab. */
export const isActiveTab = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);
