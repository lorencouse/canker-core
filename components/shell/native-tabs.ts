/**
 * In the app, the tab bar is the platform's own: on iOS a UITabBar laid over
 * the webview, which iOS 26 draws as Liquid Glass (and older iOS as the
 * standard frosted bar); on Android Material 3's navigation bar, floating as
 * a pill. CSS can imitate the material but not the lensing. Both live in the
 * local plugin native/plugins/tab-bar, Kouzr's nativetabs pattern.
 *
 * The native side draws what it is told and reports taps back; it holds no
 * routes and no rules. Which tabs there are, which one is lit, its colours
 * and when it is out of the way all stay here, so a deploy can change any of
 * them without a new binary. Only the icons are in the binary.
 *
 * WHERE IT IS NOT. The browser keeps the web bar, and so does an app built
 * before the plugin: the apps load the deployed site, so this code reaches
 * binaries that have no native bar, and hiding the web bar there would leave
 * no navigation at all. So the native bar is used only when the plugin
 * answers, and the first call it refuses puts the web bar back.
 *
 * Only the bar is native. Where utils/nav-mode.ts says rail, the native bar
 * is put away and the web rail is drawn; neither platform has a rail that
 * floats at the foot of the right edge.
 *
 * THE INSET. Everything that clears the bar reads --tab-lift (styles/main.css).
 * The native bar answers with its own top, which replaces it on <html>; the
 * web bar keeps its place, unseen, under <html data-native-tabs>.
 */
import {
  Capacitor,
  registerPlugin,
  type PluginListenerHandle
} from '@capacitor/core';

/** A tab as the bar draws it. */
export type NativeTab = { id: string; label: string; active: boolean };

/** What the native side is sent: the whole bar, every time it changes. */
export type BarState = {
  items: { id: string; title: string; symbol: string }[];
  selected: string | null;
  hidden: boolean;
  dark: boolean;
  /** The page's own tokens as #rrggbb, read at the time, so a theme change
   *  is one more `set` rather than a second palette in native code. iOS
   *  takes only the tint and draws the rest from the system's material. */
  tint: string;
  ink: string;
  muted: string;
  surface: string;
  indicator: string;
};

interface NativeTabBarPlugin {
  /** Draws the bar and answers with how far its top sits above the bottom
   *  of the webview, in CSS pixels (0 when it cannot say yet). */
  set(state: BarState): Promise<{ top?: number }>;
  addListener(
    event: 'select',
    cb: (e: { id: string }) => void
  ): Promise<PluginListenerHandle>;
  /** The bar's top moved without a `set` (Android: gestures and buttons
   *  swapped, or the phone turned). */
  addListener(
    event: 'top',
    cb: (e: { top?: number }) => void
  ): Promise<PluginListenerHandle>;
}

export const NativeTabBar = registerPlugin<NativeTabBarPlugin>('NativeTabBar');

/**
 * Each tab's glyph, by the tab's id (its href without the slash). iOS names
 * an SF Symbol, filled as Apple's tab bars draw them; Android names a vector
 * the plugin carries (res/drawable/tab_<name> and tab_<name>_fill, drawn from
 * the same lucide icons as the web bar), so a new tab needs a new binary to
 * get its icon there. Until then it draws a circle.
 */
export const SF_SYMBOLS: Record<string, string> = {
  today: 'calendar.badge.checkmark',
  'my-sores': 'map.fill',
  insights: 'chart.xyaxis.line',
  profile: 'gearshape.fill'
};
export const ANDROID_ICONS: Record<string, string> = {
  today: 'today',
  'my-sores': 'map',
  insights: 'insights',
  profile: 'settings'
};

type BarPlatform = 'ios' | 'android';

export const symbolFor = (id: string, platform: BarPlatform): string =>
  platform === 'android'
    ? (ANDROID_ICONS[id] ?? 'circle')
    : (SF_SYMBOLS[id] ?? 'circle.fill');

export type Palette = Pick<
  BarState,
  'dark' | 'tint' | 'ink' | 'muted' | 'surface' | 'indicator'
>;

/** "240 48% 17%", as the tokens are written, to #rrggbb. */
export function hslToHex(triple: string): string | null {
  const m = triple
    .trim()
    .match(/^(-?[\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%$/);
  if (!m) return null;
  const h = (((Number(m[1]) % 360) + 360) % 360) / 360;
  const s = Number(m[2]) / 100;
  const l = Number(m[3]) / 100;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) => {
    const u = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    const v =
      u < 1 / 6
        ? p + (q - p) * 6 * u
        : u < 1 / 2
          ? q
          : u < 2 / 3
            ? p + (q - p) * (2 / 3 - u) * 6
            : p;
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(h + 1 / 3)}${channel(h)}${channel(h - 1 / 3)}`;
}

/** The colours the bar takes from the page, as they stand now. */
export function readPalette(): Palette {
  const root = document.documentElement;
  const css = getComputedStyle(root);
  const v = (name: string, fallback: string) =>
    hslToHex(css.getPropertyValue(name)) ?? fallback;
  const dark = root.classList.contains('dark');
  return {
    dark,
    // The lit tab is ink, as on the web bar: indigo is the colour of
    // actions, not places.
    tint: v('--foreground', dark ? '#f3f3fd' : '#16163f'),
    ink: v('--foreground', dark ? '#f3f3fd' : '#16163f'),
    muted: v('--muted-foreground', dark ? '#bcbdea' : '#4a4a78'),
    surface: v('--card', dark ? '#1a1b48' : '#ffffff'),
    indicator: v('--accent', dark ? '#2a2b66' : '#e6e6fb')
  };
}

export function barState(
  tabs: NativeTab[],
  hidden: boolean,
  palette: Palette,
  platform: BarPlatform
): BarState {
  return {
    items: tabs.map((t) => ({
      id: t.id,
      title: t.label,
      symbol: symbolFor(t.id, platform)
    })),
    selected: tabs.find((t) => t.active)?.id ?? null,
    hidden,
    ...palette
  };
}

/**
 * Sends a state only when it differs from the last one sent, so a render that
 * changes nothing costs no trip across the bridge. A refusal forgets the last
 * state and hands the bar back to the web.
 */
export type BarSync = ((s: BarState) => void) & { forget: () => void };

export function makeSync(
  send: (s: BarState) => Promise<{ top?: number }>,
  onTop: (top: number) => void,
  onRefused: () => void
): BarSync {
  let last = '';
  const sync = (s: BarState) => {
    const key = JSON.stringify(s);
    if (key === last) return;
    last = key;
    send(s).then(
      (r) => {
        if (typeof r?.top === 'number' && r.top > 0) onTop(r.top);
      },
      () => {
        last = '';
        onRefused();
      }
    );
  };
  return Object.assign(sync, { forget: () => void (last = '') });
}

/**
 * The native bar's top as the page's --tab-lift, and <html data-native-tabs>
 * while it is drawn; null gives both back to the stylesheet.
 */
export function applyTop(top: number | null): void {
  const root = document.documentElement;
  if (top == null) {
    root.style.removeProperty('--tab-lift');
    delete root.dataset.nativeTabs;
  } else {
    root.style.setProperty('--tab-lift', `${Math.round(top * 10) / 10}px`);
    root.dataset.nativeTabs = '';
  }
}

/**
 * Whatever covers the foot of the page: an open dialog or list, or a screen
 * that takes the whole window (the check-in, marked data-covers-tabs). The
 * web bar is simply under them; the native one is above the webview and has
 * to be put away.
 */
export const COVERS_TABS =
  '[data-covers-tabs],[role="dialog"][data-state="open"],[role="alertdialog"][data-state="open"],[role="listbox"][data-state="open"]';

let refused = false;

export const nativeTabsAvailable = (): boolean =>
  !refused &&
  (Capacitor.getPlatform() === 'ios' ||
    Capacitor.getPlatform() === 'android') &&
  Capacitor.isPluginAvailable('NativeTabBar');

export const refuseNativeTabs = () => {
  refused = true;
  applyTop(null);
};

export const barPlatform = (): BarPlatform =>
  Capacitor.getPlatform() === 'android' ? 'android' : 'ios';
