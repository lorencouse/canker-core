'use client';

import { useEffect, useState } from 'react';
import { HeartPulse, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  importLastNight,
  nightEndFor,
  sleepImportAvailable,
  type ImportedSleep
} from '@/utils/health-sleep';
import { tap } from '@/utils/native';

/**
 * "Import from Health" on the Sleep screen. Renders nothing on the web, in an
 * app version without the Health plugin, or on an Android phone without
 * Health Connect. Permission is asked on the first tap, not before.
 *
 * Support is read only once mounted, inside the effect: the server renders
 * this as the web, so deciding earlier would mismatch the native hydration.
 */
export default function SleepImport({
  day,
  now,
  onImport,
  disabled
}: {
  /** The day the Sleep screen is saving to. */
  day: string;
  now: Date;
  onImport: (hours: number, source: ImportedSleep['source']) => void;
  disabled?: boolean;
}) {
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let live = true;
    sleepImportAvailable().then((yes) => {
      if (live) setAvailable(yes);
    });
    return () => {
      live = false;
    };
  }, []);

  if (!available) return null;

  const run = async () => {
    tap();
    setBusy(true);
    setMissing(false);
    try {
      const night = await importLastNight(nightEndFor(day, now));
      if (night) onImport(night.hours, night.source);
      // A refusal looks the same as an empty night on iOS, so both get the
      // same quiet line and the screen stays manual.
      else setMissing(true);
    } catch {
      // importLastNight already turns failures into null; this only keeps an
      // unexpected throw just as quiet.
      setMissing(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="touch"
        className="w-full"
        onClick={run}
        disabled={busy || disabled}
      >
        {busy ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <HeartPulse aria-hidden="true" />
        )}
        Import from Health
      </Button>
      <p role="status" className="mt-1 text-sm text-muted-foreground">
        {missing ? 'No sleep found for last night' : null}
      </p>
    </div>
  );
}
