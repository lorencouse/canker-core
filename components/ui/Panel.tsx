import * as React from 'react';
import { cn } from '@/utils/cn';

/*
 * A worksheet with a title bar across the top.
 *
 * The surface itself is .surface-worksheet, defined once in styles/main.css
 * alongside instrument and canvas - this component adds only the bar, which
 * is the one genuinely new piece. The bar is inverted, ink ground and paper
 * text, and it does the job a card header used to do without needing a
 * second divider under it: what this is about on the left, when on the
 * right. It is why a column of these reads as a set of records rather than
 * as a stack of identical rectangles.
 *
 * Use it where a surface has a subject worth naming. A worksheet that sits
 * under its own <h2> should stay a plain .surface-worksheet instead, or the
 * heading gets said twice.
 */

const Panel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { elevated?: boolean }
>(({ className, elevated = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'surface-worksheet text-foreground',
      // A panel nested inside another surface sits flat; two stacked
      // offsets read as a mistake rather than as depth.
      !elevated && 'shadow-none',
      className
    )}
    {...props}
  />
));
Panel.displayName = 'Panel';

/** The inverted bar. Left slot is what this panel is about, right is when. */
const PanelBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'panel-bar flex items-center justify-between gap-3 px-3.5 py-2',
      className
    )}
    {...props}
  />
));
PanelBar.displayName = 'PanelBar';

const PanelTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'font-display text-[0.9375rem] font-semibold uppercase tracking-[0.09em]',
      className
    )}
    {...props}
  />
));
PanelTitle.displayName = 'PanelTitle';

/** The right-hand slot in the bar: a date, a day count, a reading total. */
const PanelMeta = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'font-display text-[0.8125rem] font-medium uppercase tracking-[0.09em] tabular opacity-70',
      className
    )}
    {...props}
  />
));
PanelMeta.displayName = 'PanelMeta';

const PanelBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('grid gap-5 px-4 py-5', className)} {...props} />
));
PanelBody.displayName = 'PanelBody';

export { Panel, PanelBar, PanelTitle, PanelMeta, PanelBody };
