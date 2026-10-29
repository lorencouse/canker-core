import * as React from 'react';
import { cn } from '@/utils/cn';

/*
 * Card is the marketing and auth container only. Data screens use the
 * surface classes in styles/main.css (.surface-worksheet and friends).
 */

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('border border-border bg-card text-foreground', className)}
    {...props}
  />
));
Card.displayName = 'Card';
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  // A card that is the whole page (sign-in) needs its title to be the h1.
  React.HTMLAttributes<HTMLHeadingElement> & { as?: 'div' | 'h1' | 'h2' | 'h3' }
>(({ className, as: Comp = 'div', ...props }, ref) => (
  <Comp
    ref={ref}
    className={cn(
      'font-display text-2xl font-semibold uppercase leading-none tracking-[0.04em]',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';
const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent
};
