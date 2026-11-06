/**
 * Contrast arithmetic for the design tokens in styles/main.css.
 *
 * Tokens are bare HSL triplets ("240 85% 62%") so Tailwind can add an alpha
 * channel; this reads them back and applies the WCAG 2.x formula, so a
 * palette change that breaks AA fails a test instead of waiting for someone
 * to squint at dark mode.
 */

function hslToRgb(triplet: string): [number, number, number] {
  const [h, s, l] = triplet
    .split('/')[0]
    .trim()
    .split(/\s+/)
    .map((part) => parseFloat(part));
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) =>
    light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

function luminance(triplet: string): number {
  const [r, g, b] = hslToRgb(triplet).map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two HSL triplets, always >= 1. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Custom properties declared in one scope's block, keyed without the leading
 * dashes. Scopes in main.css are `:root` and `.dark`; the block is found by
 * its selector and ends at the first closing brace, which holds because
 * token blocks contain no nested rules.
 */
export function readTokens(
  css: string,
  scope: ':root' | '.dark'
): Record<string, string> {
  const escaped = scope.replace(/[.:]/g, '\\$&');
  const block = new RegExp(`(?:^|\\s)${escaped}\\s*\\{([^}]*)\\}`, 'm').exec(
    css.replace(/\/\*[\s\S]*?\*\//g, '')
  );
  const tokens: Record<string, string> = {};
  if (!block) return tokens;
  // exec loop rather than matchAll: the tsconfig target predates iterating
  // a RegExpStringIterator.
  const decl = /--([\w-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = decl.exec(block[1]))) {
    tokens[m[1]] = m[2].trim();
  }
  return tokens;
}

/** CIE L*a*b* (D65) of an HSL triplet, via linear sRGB and XYZ. */
export function toLab(triplet: string): [number, number, number] {
  const [r, g, b] = hslToRgb(triplet).map((c) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (v: number) =>
    v > 216 / 24389 ? Math.cbrt(v) : ((24389 / 27) * v + 16) / 116;
  const [fx, fy, fz] = [f(x), f(y), f(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/**
 * CIEDE2000 colour difference between two L*a*b* colours (Sharma, Wu and
 * Dalal 2005). Unlike the WCAG ratio, which only compares luminance, this
 * sees hue: a pale red dot on pale violet tissue differs even at equal
 * lightness, which is what finding a sore on the map depends on.
 */
export function deltaE2000(
  [l1, a1, b1]: [number, number, number],
  [l2, a2, b2]: [number, number, number]
): number {
  const rad = Math.PI / 180;
  const pow7 = (v: number) => Math.sqrt(v ** 7 / (v ** 7 + 25 ** 7));
  const cBar = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const g = 0.5 * (1 - pow7(cBar));
  const a1p = (1 + g) * a1;
  const a2p = (1 + g) * a2;
  const c1p = Math.hypot(a1p, b1);
  const c2p = Math.hypot(a2p, b2);
  const hue = (b: number, a: number) => {
    if (a === 0 && b === 0) return 0;
    const h = Math.atan2(b, a) / rad;
    return h < 0 ? h + 360 : h;
  };
  const h1p = hue(b1, a1p);
  const h2p = hue(b2, a2p);
  const chroma = c1p * c2p;

  let dhp = 0;
  if (chroma !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dL = l2 - l1;
  const dC = c2p - c1p;
  const dH = 2 * Math.sqrt(chroma) * Math.sin((dhp * rad) / 2);

  const lBar = (l1 + l2) / 2;
  const cBarP = (c1p + c2p) / 2;
  let hBar = h1p + h2p;
  if (chroma !== 0) {
    if (Math.abs(h1p - h2p) > 180) hBar += hBar < 360 ? 360 : -360;
    hBar /= 2;
  }
  const t =
    1 -
    0.17 * Math.cos((hBar - 30) * rad) +
    0.24 * Math.cos(2 * hBar * rad) +
    0.32 * Math.cos((3 * hBar + 6) * rad) -
    0.2 * Math.cos((4 * hBar - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hBar - 275) / 25) ** 2));
  const rC = 2 * pow7(cBarP);
  const sL = 1 + (0.015 * (lBar - 50) ** 2) / Math.sqrt(20 + (lBar - 50) ** 2);
  const sC = 1 + 0.045 * cBarP;
  const sH = 1 + 0.015 * cBarP * t;
  const rT = -Math.sin(2 * dTheta * rad) * rC;
  return Math.sqrt(
    (dL / sL) ** 2 +
      (dC / sC) ** 2 +
      (dH / sH) ** 2 +
      rT * (dC / sC) * (dH / sH)
  );
}

/** CIEDE2000 between two HSL triplets (alpha ignored). */
export const deltaE = (a: string, b: string) =>
  deltaE2000(toLab(a), toLab(b));
