'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';

import DayLogForm from '@/components/today/DayLogForm';
import SoreCheckInCard from '@/components/today/SoreCheckInCard';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/Toasts/use-toast';
import type { DayLog, Sore } from '@/types';
import { answerLine } from '@/utils/course';
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
  /*
   * The app's one deliberate flourish. Save used to produce a toast and
   * nothing else, which said "we heard you" but not what changed; this pops
   * today's cell into each course instead, so the press shows its own
   * consequence. It lasts as long as the animation and then stops existing,
   * because a class left on would replay on every re-render.
   */
  const [justSaved, setJustSaved] = useState(false);

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
   * headline answers the question again the moment a slider moves — before
   * anything is saved. It is the fastest feedback in the app.
   */
  const answer = useMemo(() => answerLine(sores), [sores]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 lg:px-6 lg:py-8">
      {/*
        The screen leads with the answer, not with the date and not with the
        word "Today" — the top bar already says that. Whether a sore is
        healing is the question someone opens this app to ask, so it is the
        one sentence set in display type.
      */}
      <header className="mb-5 lg:mb-8">
        <p className="tabular text-sm text-muted-foreground">{dateLine}</p>
        <h1 className="mt-1.5 text-title">{answer.headline}</h1>
        {answer.note && (
          <p className="prose-measure mt-2 text-muted-foreground">
            {answer.note}
          </p>
        )}
      </header>

      <div className="space-y-6">
        {/*
          With nothing open there is no list to head, and the answer line has
          already said so — a section called "Open sores" containing a card
          that repeats "nothing open" is the same sentence three times. What
          is left is the one action, and which verb it wants depends on
          whether this person has ever logged anything: a first mark and a
          next mark are different invitations, and the second should not
          read as a nag on a day someone has earned.
        */}
        {open.length === 0 ? (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Button asChild variant="outline" size="touch" className="w-full sm:w-auto">
              <Link href="/my-sores">
                {sores.length === 0 ? 'Mark your first sore' : 'Mark a new sore'}
              </Link>
            </Button>
            <p className="prose-measure text-sm text-muted-foreground">
              {sores.length === 0
                ? 'The map is where a sore starts. It takes about fifteen seconds.'
                : 'Logging what you ate and how you slept is still worth doing — it is how patterns show up on the days between sores.'}
            </p>
          </div>
        ) : (
          <section className="space-y-3" aria-labelledby="open-sores">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="open-sores" className="text-subhead">
                Open sores
              </h2>
              <p className="tabular text-sm text-muted-foreground">
                {unlogged === 0
                  ? 'All logged'
                  : `${unlogged} of ${open.length} left`}
              </p>
            </div>
            {open.map((sore) => (
              <SoreCheckInCard
                key={sore.id}
                sore={sore}
                onChange={updateSore}
                onHeal={() => heal(sore)}
                justSaved={justSaved}
              />
            ))}
          </section>
        )}

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
