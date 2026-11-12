/**
 * Where the signed-in app's four tabs go: a bar along the bottom, a rail down
 * the right edge, or links in the top bar. <html data-nav> carries the
 * answer, and the shell's Tailwind variants (`rail:`, `navtop:`) read it.
 *
 * THE OWNER'S RULE, shared with Kouzr and Aireio (Kouzr's
 * apps/app/src/rail.ts is the source; its header is the long version):
 *
 *   1. A Surface Duo has the rail on the right ALWAYS: one screen upright or
 *      on its side, spanned or stacked, in Chrome and in the app.
 *   2. Every wide touch screen has it (WIDE: 900px, or 720px wide and 560px
 *      tall): an iPad either way up, an unfolded foldable. Not across a fold
 *      that runs across the screen, where a rail down the side would cross
 *      the hinge; the bar along the foot stays on the lower screen.
 *   3. Any other short, wide touch screen has it: under 740px tall (the
 *      screen's height, not the window's, so a browser's toolbars do not
 *      count), wider than tall and at least 440px wide. A phone on its side,
 *      iPhone Duo open as a book.
 *   4. A mouse or trackpad from lg (1024px) up gets the links in the top bar.
 *   5. Everything else keeps the bar along the bottom: every phone upright.
 *
 * The rail is about where the tabs go, nothing else. Which content layout a
 * page draws is decided by window size alone (Tailwind's breakpoints), never
 * by touch or hover, so a spanned Duo and an iPad draw the same layout.
 *
 * navMode and readNavInput are self-contained on purpose: the root layout
 * inlines both (navModeScript) so the attribute is on <html> before the
 * first paint, and a tab bar never jumps from the bottom to the side.
 */

export type NavMode = 'bar' | 'rail' | 'top';

export type NavInput = {
  /** The window, in CSS px. */
  width: number;
  height: number;
  /** The screen as reported (screen.width, screen.height). */
  screenWidth: number;
  screenHeight: number;
  /** (hover: none) and (pointer: coarse). */
  touch: boolean;
  /** (min-width: 1024px) with a hovering pointer. */
  desktop: boolean;
  userAgent: string;
  /** The fold, if there is one (utils/fold.ts). */
  foldAxis: 'columns' | 'rows' | null;
};

export function navMode(i: NavInput): NavMode {
  var TALL = 740;
  var RAIL_MIN_WIDTH = 440;
  var w = i.width;
  var h = i.height;
  var a = i.screenWidth || 0;
  var b = i.screenHeight || 0;
  // A Duo's screen is the whole spanned display, 1114 x 720 give or take,
  // either way round, whichever pane the window is on.
  var long = Math.max(a, b);
  var short = Math.min(a, b);
  var duoScreen = long >= 1090 && long <= 1130 && short >= 710 && short <= 765;
  var duo = /surface\s*duo/i.test(i.userAgent || '') || (i.touch && duoScreen);
  if (duo) return 'rail';
  var acrossFold = i.foldAxis === 'rows';
  var wide = w >= 900 || (w >= 720 && h >= 560);
  if (i.touch && !acrossFold && wide) return 'rail';
  // The screen's height as the window is held. A screen reported wider than
  // tall follows the device (Android), so its height is the height; iOS
  // reports it upright, so the window's orientation picks the side.
  var side = a > b ? b : w > h ? Math.min(a, b) : Math.max(a, b);
  var screenTall = Math.max(h, side);
  if (
    i.touch &&
    !acrossFold &&
    screenTall < TALL &&
    w > h &&
    w >= RAIL_MIN_WIDTH
  ) {
    return 'rail';
  }
  if (i.desktop) return 'top';
  return 'bar';
}

/** What navMode needs, read off the window. */
export function readNavInput(
  foldAxis: 'columns' | 'rows' | null = null
): NavInput {
  var mq = function (q: string) {
    return typeof matchMedia === 'function' && matchMedia(q).matches;
  };
  return {
    width: innerWidth,
    height: innerHeight,
    screenWidth: (typeof screen !== 'undefined' && screen.width) || 0,
    screenHeight: (typeof screen !== 'undefined' && screen.height) || 0,
    touch: mq('(hover: none) and (pointer: coarse)'),
    desktop: mq('(min-width: 1024px) and (hover: hover)'),
    userAgent: navigator.userAgent || '',
    foldAxis: foldAxis
  };
}

/** Sets <html data-nav> from the window now. Returns the mode. */
export function applyNavMode(
  foldAxis: 'columns' | 'rows' | null = null
): NavMode {
  const mode = navMode(readNavInput(foldAxis));
  document.documentElement.dataset.nav = mode;
  return mode;
}

/**
 * The same, as a script for the document head: runs before the first paint.
 * A failure leaves the attribute off, and the stylesheet's default is the
 * bottom bar.
 */
export const navModeScript = `try{document.documentElement.dataset.nav=(${navMode.toString()})((${readNavInput.toString()})(null))}catch(e){}`;
