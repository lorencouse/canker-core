import { ViewTransition, type ReactNode } from 'react';

/**
 * The transition types a push names. A link or a state change that goes one
 * level deeper carries PUSH, its way back POP; the browser's own back and
 * forward carry neither, so they swap plainly instead of sliding the wrong
 * way (and never fight the system's back gesture, which draws its own).
 */
export const PUSH = 'nav-forward';
export const POP = 'nav-back';

/**
 * A screen that pushes in from the right and pops back out to it, as a
 * phone's navigation stack does: Settings' sub-screens and a sore's detail.
 * The slide is the View Transitions API through React's <ViewTransition>;
 * a browser without it shows the plain swap it always did. The keyframes
 * are `.push-*` and `.pop-*` in styles/main.css.
 */
export default function PushScreen({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ViewTransition
      enter={{ [PUSH]: 'push-in', [POP]: 'pop-in', default: 'none' }}
      exit={{ [PUSH]: 'push-out', [POP]: 'pop-out', default: 'none' }}
      default="none"
    >
      <div className={className}>{children}</div>
    </ViewTransition>
  );
}
