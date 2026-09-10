'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';

import DayLogForm from '@/components/today/DayLogForm';
import SoreCheckInCard from '@/components/today/SoreCheckInCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/Toasts/use-toast';
import type { DayLog, Sore } from '@/types';
import { saveDayLog, setSoreHealed, upsertSores } from '@/utils/actions/soreActions';
import { notify, tap } from '@/utils/native';
import { dayKey, hasReadingOn } from '@/utils/readings';

/**
 * The daily check-in.
 *
 * One screen, one Save. Each open sore gets a compact card with today's
 * sliders; below them the day's log — what might have caused things and
 * what was tried. Everything is edited locally and written in one go, so a
 * person can work down the list without a network round trip per slider,
 * and so a lost connection loses nothing until they press Save.
 *
 * The map is for *where*; this screen is for *how it is going*, which is the
 * question someone with a sore asks every day.
 */
export default function TodayScreen({
  sores: initialSores,
  dayLogs
}: {
  sores: Sore[];
  dayLogs: DayLog[];
}) {
  const router = useRouter();
  const today = dayKey(new Date());
  const [sores, setSores] = useState(initialSores);
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const [log, setLog] = useState<DayLog>(
    () =>
      dayLogs.find((l) => l.day === today) ?? {
        day: today,
        triggers: [],
        treatments: [],
        note: null
      }
  );
  const [logDirty, setLogDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const open = useMemo(() => sores.filter((s) => !s.healed_at), [sores]);
  const unlogged = open.filter((s) => !hasReadingOn(s, new Date())).length;
  const dirty = changed.size > 0 || logDirty;

  const updateSore = (next: Sore) => {
    setSores((prev) => prev.map((s) => (s.id === next.id ? next : s)));
    setChanged((prev) => new Set(prev).add(next.id));
  };

  const updateLog = (next: DayLog) => {
    setLog(next);
    setLogDirty(true);
  };

  const heal = async (sore: Sore) => {
    const healedAt = new Date().toISOString();
    const result = await setSoreHealed(sore.id, healedAt);
    if (!result.ok) {
      toast({ variant: 'destructive', title: result.error });
      return;
    }
    setSores((prev) => prev.map((s) => (s.id === sore.id ? { ...s, healed_at: healedAt } : s)));
    notify('success');
  };

  const save = async () => {
    setSaving(true);
    try {
      const toWrite = sores.filter((s) => changed.has(s.id));
      const [soreResult, logResult] = await Promise.all([
        toWrite.length ? upsertSores(toWrite) : Promise.resolve({ ok: true as const }),
        logDirty ? saveDayLog(log) : Promise.resolve({ ok: true as const })
      ]);
      const failure = [soreResult, logResult].find((r) => !r.ok);
      if (failure && !failure.ok) {
        notify('error');
        toast({ variant: 'destructive', title: failure.error });
        return;
      }
      setChanged(new Set());
      setLogDirty(false);
      notify('success');
      toast({ title: 'Saved today’s check-in.' });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const dateLine = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 lg:px-6 lg:py-8">
      <header className="mb-4 lg:mb-6">
        <h1 className="hidden text-title lg:block">Today</h1>
        <p className="text-muted-foreground lg:mt-2">
          {dateLine}
          {open.length > 0 && (
            <>
              {' · '}
              {unlogged === 0
                ? 'Everything logged.'
                : `${unlogged} of ${open.length} sore${open.length === 1 ? '' : 's'} still to log.`}
            </>
          )}
        </p>
      </header>

      <div className="space-y-6">
        <section className="space-y-3" aria-labelledby="open-sores">
          <h2 id="open-sores" className="text-subhead">
            Open sores
          </h2>
          {open.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="font-medium">Nothing open right now.</p>
                <p className="prose-measure mx-auto mt-1 text-sm text-muted-foreground">
                  A good day. If a new one appears, mark it on the map. Logging
                  what you ate or how you slept is still worth doing — it is how
                  patterns show up on the days between sores.
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/my-sores">Open the mouth map</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            open.map((sore) => (
              <SoreCheckInCard
                key={sore.id}
                sore={sore}
                onChange={updateSore}
                onHeal={() => heal(sore)}
              />
            ))
          )}
        </section>

        <section className="space-y-3" aria-labelledby="day-log">
          <h2 id="day-log" className="text-subhead">
            What else happened today?
          </h2>
          <DayLogForm log={log} onChange={updateLog} />
        </section>
      </div>

      {/*
        Sticky above the tab bar on a phone so Save is under the thumb no
        matter how many cards are above it; inline on a desktop where the
        whole screen fits.
      */}
      <div className="sticky bottom-[calc(var(--tab-bar-h)+var(--safe-bottom)+0.75rem)] mt-6 lg:static">
        <Button
          type="button"
          size="touch"
          className="w-full shadow-lg lg:w-auto lg:shadow-none"
          disabled={!dirty || saving}
          onClick={() => {
            tap();
            save();
          }}
        >
          {saving ? <Loader2 className="animate-spin" /> : <Check aria-hidden="true" />}
          {saving ? 'Saving…' : dirty ? 'Save today’s check-in' : 'Nothing to save yet'}
        </Button>
      </div>
    </div>
  );
}
