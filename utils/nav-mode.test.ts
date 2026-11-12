import { describe, expect, it } from 'vitest';

import { navMode, navModeScript, type NavInput } from './nav-mode';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)';
const DUO =
  'Mozilla/5.0 (Linux; Android 12; Surface Duo) AppleWebKit/537.36 Chrome/140 Mobile';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/140 Mobile';

const touch = (
  width: number,
  height: number,
  extra: Partial<NavInput> = {}
): NavInput => ({
  width,
  height,
  screenWidth: width,
  screenHeight: height,
  touch: true,
  desktop: false,
  userAgent: IPHONE,
  foldAxis: null,
  ...extra
});

describe('navMode: the owner rule shared with Kouzr', () => {
  it('keeps the bar along the bottom on every phone upright', () => {
    expect(navMode(touch(390, 844))).toBe('bar');
    expect(navMode(touch(375, 667))).toBe('bar');
    expect(navMode(touch(320, 568))).toBe('bar');
    // A browser's toolbars make the window short; the screen is not.
    expect(navMode(touch(390, 664, { screenHeight: 844 }))).toBe('bar');
  });

  it('puts the rail on a Surface Duo, one screen or spanned, either way up', () => {
    const duo = { userAgent: DUO, screenWidth: 1114, screenHeight: 720 };
    expect(navMode(touch(540, 720, duo))).toBe('rail');
    expect(navMode(touch(1114, 720, duo))).toBe('rail');
    expect(navMode(touch(720, 540, duo))).toBe('rail');
    expect(navMode(touch(720, 1114, { ...duo, foldAxis: 'rows' }))).toBe(
      'rail'
    );
  });

  it('knows a Duo by its spanned screen when the user agent is reduced', () => {
    expect(
      navMode(
        touch(540, 720, {
          userAgent: ANDROID,
          screenWidth: 1114,
          screenHeight: 720
        })
      )
    ).toBe('rail');
  });

  it('puts the rail on every wide touch screen: an iPad either way up', () => {
    expect(navMode(touch(820, 1180))).toBe('rail');
    expect(navMode(touch(1180, 820))).toBe('rail');
    expect(navMode(touch(1376, 1032))).toBe('rail');
    // An unfolded foldable.
    expect(navMode(touch(841, 701, { userAgent: ANDROID }))).toBe('rail');
  });

  it('gives the bar back across a fold that runs across the screen', () => {
    expect(
      navMode(touch(841, 701, { userAgent: ANDROID, foldAxis: 'rows' }))
    ).toBe('bar');
  });

  it('puts the rail on short wide touch screens: a phone on its side', () => {
    expect(navMode(touch(844, 390))).toBe('rail');
    expect(navMode(touch(667, 375))).toBe('rail');
    // iPhone Duo open as a book.
    expect(navMode(touch(951, 669))).toBe('rail');
  });

  it('keeps the bar on a short window too narrow for the rail', () => {
    expect(navMode(touch(430, 400))).toBe('bar');
  });

  it('puts the links in the top bar for a mouse from lg up', () => {
    const mouse = { touch: false, desktop: true, userAgent: 'Macintosh' };
    expect(navMode(touch(1440, 900, mouse))).toBe('top');
    expect(navMode(touch(1024, 700, mouse))).toBe('top');
  });

  it('keeps the bar for a mouse in a narrow window', () => {
    expect(navMode(touch(800, 900, { touch: false, desktop: false }))).toBe(
      'bar'
    );
  });
});

describe('navModeScript', () => {
  it('runs on its own, with nothing from the module in scope', () => {
    const doc = { documentElement: { dataset: {} as Record<string, string> } };
    const run = new Function(
      'document',
      'innerWidth',
      'innerHeight',
      'screen',
      'navigator',
      'matchMedia',
      navModeScript
    );
    run(
      doc,
      844,
      390,
      { width: 844, height: 390 },
      { userAgent: IPHONE },
      (q: string) => ({
        matches: q.includes('coarse')
      })
    );
    expect(doc.documentElement.dataset.nav).toBe('rail');
  });
});
