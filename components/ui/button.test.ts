import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Button, buttonVariants } from './button';

const VARIANTS = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'overlay'] as const;
const SIZES = ['default', 'sm', 'lg', 'icon', 'xs', 'touch'] as const;

/*
 * A button label is one line, never two (AGENTS.md, UI formatting rules).
 * Checked on the class string because there is no DOM here: what matters is
 * that no variant or size, alone or combined, drops or overrides nowrap.
 */
describe('buttonVariants', () => {
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      it(`${variant}/${size} keeps its label on one line`, () => {
        const classes = buttonVariants({ variant, size }).split(/\s+/);
        expect(classes).toContain('whitespace-nowrap');
        expect(classes).toContain('max-w-full');
        expect(classes.some((c) => /^whitespace-(normal|pre-wrap|pre-line|break-spaces)$/.test(c))).toBe(false);
      });
    }
  }

  it('lets a caller className override everything but the wrapping', () => {
    const html = renderToStaticMarkup(
      createElement(Button, { className: 'w-full whitespace-normal' }, 'Save')
    );
    const classes = /class="([^"]*)"/.exec(html)![1].split(/\s+/);
    expect(classes).toContain('w-full');
    expect(classes).toContain('whitespace-nowrap');
    expect(classes).not.toContain('whitespace-normal');
  });

  it('gives every size under 44px the tap-target hit area', () => {
    for (const size of ['default', 'sm', 'icon', 'xs'] as const) {
      expect(buttonVariants({ size }).split(/\s+/)).toContain('tap-target');
    }
  });
});
