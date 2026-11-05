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
  for (const m of block[1].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    tokens[m[1]] = m[2].trim();
  }
  return tokens;
}
