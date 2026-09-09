'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * Whether the dark palette is currently in effect.
 *
 * Returns false until the theme has resolved on the client, so canvas and
 * chart colours never render against a theme the server guessed wrong.
 */
export function useIsDark(): boolean {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return mounted && resolvedTheme === 'dark';
}
