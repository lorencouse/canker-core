'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import DayLogForm from '@/components/today/DayLogForm';
import SoreCheckInCard from '@/components/today/SoreCheckInCard';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/Toasts/use-toast';
import type { DayLog, Sore } from '@/types';
import { answerLine } from '@/utils/course';
import { saveDayLog, setSoreHealed, upsertSores } from '@/utils/actions/soreActions';
import { cn } from '@/utils/cn';
import { notify, tap } from '@/utils/native';
import { dayKey, localTimeZone } from '@/utils/readings';

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
  const [saved, setSaved] = useState(false);
  /*
   * The app's one deliberate flourish. Save used to produce a toast and
   * nothing else, which said "we heard you" but not what changed; this pops
   * today's cell into each course instead, so the press shows its own
   * consequence. It lasts as long as the animation and then stops existing,
   * because a class left on would replay on every re-render.
   */
  const [justSaved, setJustSaved] = useState(false);

  const open = useMemo(() => sores.filter((s) => !s.healed_at), [sores]);
  const dirty = changed.size > 0 || logDirty;

  const updateSore = (next: Sore) => {
    setSores((prev) => prev.map((s) => (s.id === next.id ? next : s)));
    setChanged((prev) => new Set(prev).add(next.id));
    setSaved(false);
  };

  const updateLog = (next: DayLog) => {
    setLog(next);
    setLogDirty(true);
    setSaved(false);
  };

  /** "Left cheek, 2 triggers, 2 treatments": what Save is about to write. */
  const pendingSummary = [
    ...sores.filter((s) => changed.has(s.id)).map((s) => s.zone),
    ...(logDirty
      ? [
          count(log.triggers.length, 'trigger'),
          count(log.treatments.length, 'treatment'),
          log.note ? 'a note' : null
        ]
      : [])
  ]
    .filter(Boolean)
    .join(', ') || 'Today’s log';

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
        toWrite.length
          ? upsertSores(toWrite, localTimeZone())
          : Promise.resolve({ ok: true as const }),
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
      setSaved(true);
      notify('success');
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 400);
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

  /*
   * Recomputed from local state rather than from the server's copy, so the
   * headline answers the question again the moment a reading changes —
   * before anything is saved. It is the fastest feedback in the app.
   */
  const answer = useMemo(() => answerLine(sores), [sores]);

  return (
    <div
      className={cn(
        'mx-auto max-w-6xl px-4 py-5 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-x-8 lg:px-6 lg:py-9',
        // Room under the last field for the Save bar that floats over it.
        dirty && 'pb-28 lg:pb-9'
      )}
    >
      {/*
        The screen leads with the answer, not with the word "Today" — the
        top bar already says that. The headline is the to-do, the line under
        it is the news, in full ink because it is the point of the screen.
      */}
      <header className="lg:col-span-2">
        <time dateTime={today} className="block text-sm text-muted-foreground">
          {dateLine}
        </time>
        <h1 className="mt-0.5 text-2xl leading-tight lg:text-3xl">
          {answer.headline}
        </h1>
        {answer.note && <p className="prose-measure mt-1.5">{answer.note}</p>}
      </header>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:mt-6">
        {/*
          With nothing open there is no list, and the answer line has already
          said so. What is left is the one action, and which verb it wants
          depends on whether this person has ever logged anything: a first
          mark and a next mark are different invitations.
        */}
        {open.length === 0 ? (
          <div className="surface-worksheet flex flex-col items-start gap-3 p-4 sm:p-5">
            <p className="prose-measure">
              {sores.length === 0
                ? 'The map is where a sore starts. It takes about fifteen seconds.'
                : 'Logging what you ate and how you slept is still worth doing. It is how patterns show up on the days between sores.'}
            </p>
            <Button asChild variant="outline" size="touch" className="w-full sm:w-auto">
              <Link href="/my-sores?add">
                {sores.length === 0 ? 'Mark your first sore' : 'Mark a new sore'}
              </Link>
            </Button>
          </div>
        ) : (
          open.map((sore) => (
            <SoreCheckInCard
              key={sore.id}
              sore={sore}
              onChange={updateSore}
              onHeal={() => heal(sore)}
              justSaved={justSaved}
            />
          ))
        )}
      </div>

      {/*
        A rail beside the sores on a desktop, sticky so Save stays in reach
        however long the sore column is; a plain section under them on a
        phone.
      */}
      <section
        aria-labelledby="day-log"
        className="mt-8 lg:surface-worksheet lg:sticky lg:top-[calc(var(--app-bar-h)+var(--safe-top)+1.5rem)] lg:mt-6 lg:p-5"
      >
        <h2 id="day-log" className="text-xl">
          What else happened today?
        </h2>
        <div className="mt-3.5">
          <DayLogForm log={log} onChange={updateLog} />
        </div>

        {/*
          On a phone Save floats above the tab bar, opaque, but only while
          there is something to save: a disabled bar floating over the
          cards let them show through its label. It names what it will save,
          so the press has no surprise in it. Inside the rail on a desktop.
        */}
        <div
          className={cn(
            'mt-5 flex items-center gap-3',
            dirty &&
              'fixed inset-x-0 bottom-[calc(var(--tab-bar-h)+var(--safe-bottom))] z-30 mt-0 border-t border-border bg-background px-4 py-2.5 lg:static lg:z-auto lg:mt-5 lg:border-0 lg:bg-transparent lg:p-0'
          )}
        >
          <p aria-live="polite" className="min-w-0 flex-1 text-sm text-muted-foreground">
            {dirty ? pendingSummary : saved ? 'Saved.' : 'Nothing to save yet.'}
          </p>
          {dirty && (
            <Button
              type="button"
              size="touch"
              className="shrink-0"
              disabled={saving}
              onClick={() => {
                tap();
                save();
              }}
            >
              {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
              {saving ? 'Saving' : 'Save today'}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

/** "2 triggers", or nothing for none. */
const count = (n: number, noun: string) => (n ? `${n} ${noun}${n === 1 ? '' : 's'}` : null);
