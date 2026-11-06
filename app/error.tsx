'use client';

import { useEffect } from 'react';

import LostScreen from '@/components/shell/LostScreen';
import { Button } from '@/components/ui/button';

/**
 * Anything that throws while a screen draws lands here instead of on a blank
 * page. Readings are written by explicit saves, so a failed draw cannot have
 * lost one, and the copy can say so.
 */
export default function ErrorPage({
  error,
  retry
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <LostScreen
      title="Something went wrong"
      body="This screen did not load properly. Your sores and readings are safe."
      action={
        <Button type="button" size="touch" onClick={() => retry()}>
          Try again
        </Button>
      }
    />
  );
}
