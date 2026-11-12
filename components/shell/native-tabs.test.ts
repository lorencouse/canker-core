import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => 'web',
    isPluginAvailable: () => false
  },
  registerPlugin: () => ({})
}));
vi.mock('lucide-react', () => ({
  CalendarCheck: 'CalendarCheck',
  LineChart: 'LineChart',
  Map: 'Map',
  Settings: 'Settings'
}));

import { readTokens } from '@/utils/contrast';
import {
  ANDROID_ICONS,
  SF_SYMBOLS,
  barState,
  hslToHex,
  makeSync,
  nativeTabsAvailable,
  symbolFor
} from './native-tabs';
import { APP_NAV } from './nav-items';

const css = readFileSync(join(process.cwd(), 'styles/main.css'), 'utf8');
const ids = APP_NAV.map(({ href }) => href.slice(1));
const palette = {
  dark: false,
  tint: '#16163f',
  ink: '#16163f',
  muted: '#4a4a78',
  surface: '#ffffff',
  indicator: '#e6e6fb'
};

describe('the native tab bar bridge', () => {
  it('stays off in the browser, where the web bar is the bar', () => {
    expect(nativeTabsAvailable()).toBe(false);
  });

  it('has a glyph on both platforms for every tab', () => {
    const drawables = join(
      process.cwd(),
      'native/plugins/tab-bar/android/src/main/res/drawable'
    );
    for (const id of ids) {
      expect(SF_SYMBOLS[id], id).toBeDefined();
      const name = ANDROID_ICONS[id];
      expect(name, id).toBeDefined();
      expect(existsSync(join(drawables, `tab_${name}.xml`)), name).toBe(true);
      expect(existsSync(join(drawables, `tab_${name}_fill.xml`)), name).toBe(
        true
      );
    }
    expect(symbolFor('nowhere', 'ios')).toBe('circle.fill');
    expect(symbolFor('nowhere', 'android')).toBe('circle');
  });

  it('sends the tabs in order, the lit one, and whether it is away', () => {
    const tabs = ids.map((id) => ({
      id,
      label: id,
      active: id === 'insights'
    }));
    const s = barState(tabs, false, palette, 'ios');
    expect(s.items.map((i) => i.id)).toEqual(ids);
    expect(s.selected).toBe('insights');
    expect(s.hidden).toBe(false);
    const none = barState(
      tabs.map((t) => ({ ...t, active: false })),
      true,
      palette,
      'android'
    );
    expect(none.selected).toBeNull();
    expect(none.hidden).toBe(true);
    expect(none.items[0].symbol).toBe(ANDROID_ICONS[ids[0]]);
  });

  it('crosses the bridge only for a change, and gives up on a refusal', async () => {
    const sent: unknown[] = [];
    let refuse = false;
    const tops: number[] = [];
    let refused = 0;
    const sync = makeSync(
      (s) => {
        sent.push(s);
        return refuse
          ? Promise.reject(new Error('no'))
          : Promise.resolve({ top: 82 });
      },
      (t) => tops.push(t),
      () => refused++
    );
    const s = barState([], false, palette, 'ios');
    sync(s);
    sync({ ...s });
    await Promise.resolve();
    expect(sent).toHaveLength(1);
    expect(tops).toEqual([82]);
    sync.forget();
    refuse = true;
    sync(s);
    await new Promise((r) => setTimeout(r));
    expect(sent).toHaveLength(2);
    expect(refused).toBe(1);
  });

  it('reads the tokens as the colours the native side takes', () => {
    expect(hslToHex('0 0% 100%')).toBe('#ffffff');
    expect(hslToHex('0 100% 50%')).toBe('#ff0000');
    expect(hslToHex('240 100% 50%')).toBe('#0000ff');
    expect(hslToHex('nonsense')).toBeNull();
  });
});

const block = (selector: string) => {
  const at = css.indexOf(`${selector} {`);
  expect(at, selector).toBeGreaterThan(-1);
  return css.slice(at, css.indexOf('}', at));
};
const rem = (name: string) => {
  const m = css.match(new RegExp(`--${name}:\\s*([\\d.]+)rem`));
  expect(m, name).not.toBeNull();
  return Number(m![1]) * 16;
};

describe('the web tab bar', () => {
  it('floats as a capsule over the content', () => {
    const bar = block('.tab-bar');
    expect(bar).toMatch(/@apply glass fixed z-40 rounded-full/);
    expect(bar).toMatch(/bottom: var\(--tab-bottom\)/);
    // The content clears the bar by its lift, not by a solid strip.
    expect(block('.app-scroll')).toMatch(/var\(--tab-lift\)/);
  });

  it('is sized to its tabs and centred on anything wider than a phone', () => {
    const bar = block('.tab-bar');
    expect(bar).toMatch(/margin-inline: auto/);
    expect(bar).toMatch(/max-width: var\(--tab-bar-max\)/);
    const max = rem('tab-bar-max');
    // Wider than any phone held upright would make it a full-width bar
    // there too; each of the four tabs keeps a comfortable target.
    expect(max).toBeGreaterThanOrEqual(400);
    expect(max).toBeLessThanOrEqual(560);
    expect(max / APP_NAV.length).toBeGreaterThanOrEqual(88);
  });

  it('stands on end as the rail, with no width cap', () => {
    const rail = block(":root[data-nav='rail'] .tab-bar");
    expect(rail).toMatch(/width: var\(--rail-w\)/);
    expect(rail).toMatch(/max-width: none/);
  });

  it('keeps 44px targets inside the capsule', () => {
    // The list is inset 4px (p-1) on every side.
    expect(rem('tab-bar-h') - 8).toBeGreaterThanOrEqual(44);
  });

  it('turns solid for anyone who asks for less transparency', () => {
    const at = css.indexOf('prefers-reduced-transparency: reduce');
    expect(at).toBeGreaterThan(-1);
    expect(css.slice(at, at + 300)).toMatch(
      /background-color: hsl\(var\(--card\)\)/
    );
  });

  it('gives way to the native bar, but keeps the web rail', () => {
    expect(css).toMatch(
      /:root\[data-native-tabs\]:not\(\[data-nav='rail'\]\) \.tab-bar \{\s*visibility: hidden;/
    );
  });

  /*
   * The glass is the card at 82% over whatever scrolls under it. The labels
   * at rest are --muted-foreground; they must still clear 4.5:1 with the
   * strongest colour the page can put under the bar.
   */
  describe.each([':root', '.dark'] as const)(
    'labels on glass in %s',
    (scope) => {
      const tokens = readTokens(css, scope);
      const rgb = (t: string) => {
        const hex = hslToHex(t)!;
        return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      };
      const lum = ([r, g, b]: number[]) => {
        const f = (c: number) =>
          c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const alpha = Number(block('.glass').match(/--card\) \/ ([\d.]+)/)![1]);
      it.each(['primary', 'foreground', 'background', 'sev-10'])(
        'muted labels over %s',
        (under) => {
          if (!tokens[under]) return;
          const card = rgb(tokens.card);
          const below = rgb(tokens[under]);
          const glass = card.map((c, i) => c * alpha + below[i] * (1 - alpha));
          const a = lum(rgb(tokens['muted-foreground']));
          const b = lum(glass);
          const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        }
      );
    }
  );
});
