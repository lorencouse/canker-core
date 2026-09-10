'use client';

import type { ReactNode } from 'react';

import { openExternal } from '@/utils/native';

/**
 * A link that leaves the app.
 *
 * In a browser this is an ordinary anchor. Inside the Capacitor webview it
 * has to open the system browser instead: the webview has no URL bar and no
 * back gesture out of an off-origin page, so following a link in place
 * strands the user on someone else's site with the app apparently gone.
 */
export default function ExternalLink({
  href,
  className,
  children,
  ...rest
}: {
  href: string;
  className?: string;
  children: ReactNode;
  'aria-label'?: string;
}) {
  return (
    <a
      href={href}
      rel="noopener noreferrer"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        openExternal(href);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
