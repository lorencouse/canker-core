'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';

import Kanko from '@/components/kanko/Kanko';
import DayLogForm from '@/components/today/DayLogForm';
import SoreCheckInCard from '@/components/today/SoreCheckInCard';
import StreakBlock, {
  StreakBlockPlaceholder
} from '@/components/today/StreakBlock';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/Toasts/use-toast';
import type { DayLog, Sore } from '@/types';
import { answerLine } from '@/utils/course';
import {
  saveDayLog,
  setSoreHealed,
  upsertSores
} from '@/utils/actions/soreActions';
import { cn } from '@/utils/cn';
import { notify, tap } from '@/utils/native';
import { type Mood, withSavedLog } from '@/utils/momentum';
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
  dayLogs,
  expectedMood
}: {
  sores: Sore[];
  dayLogs: DayLog[];
  /** The server's guess at the block's mood; sizes the placeholder only. */
  expectedMood: Mood;
}) {
  const router = useRouter();
  /*
   * Which day it is belongs to the device, not the server: a server on UTC
   * is already on tomorrow during a US evening, and a block drawn there
   * would show the wrong day and then fail to hydrate. So the clock is read
   * on the device, once per visit, and everything keyed to the day waits
   * for it.
   */
  const now = useDeviceNow();
  const today = now ? dayKey(now) : null;
  const [sores, setSores] = useState(initialSores);
  /*
   * What has been written, as opposed to what is being edited. The streak
   * block reads these so Kanko's mood moves on Save, never mid-slider.
   */
  const [savedSores, setSavedSores] = useState(initialSores);
  const [savedLogs, setSavedLogs] = useState(dayLogs);
  const [changed, setChanged] = useState<Set<string>>(new Set());
  /*
   * Today's log as stored until the first edit, then the edit. Derived
   * rather than seeded, because the stored one cannot be picked until the
   * day is known.
   */
  const [editedLog, setEditedLog] = useState<DayLog | null>(null);
  const log =
    editedLog ??
    (today
      ? (dayLogs.find((l) => l.day === today) ?? blankLog(today))
      : blankLog(''));
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
  /*
   * The sore just marked healed, so its card can be replaced by a moment of
   * credit instead of simply vanishing. It stays until dismissed or the
   * screen is left: timing it out would move everything under it.
   */
  const [justHealed, setJustHealed] = useState<Sore | null>(null);

  const open = useMemo(() => sores.filter((s) => !s.healed_at), [sores]);
  const dirty = changed.size > 0 || logDirty;

  const updateSore = (next: Sore) => {
    setSores((prev) => prev.map((s) => (s.id === next.id ? next : s)));
    setChanged((prev) => new Set(prev).add(next.id));
    setSaved(false);
  };

  const updateLog = (next: DayLog) => {
    setEditedLog(next);
    setLogDirty(true);
    setSaved(false);
  };

  /** "Left cheek, 2 triggers, 2 treatments": what Save is about to write. */
  const pendingSummary =
    [
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
    setSores((prev) =>
      prev.map((s) => (s.id === sore.id ? { ...s, healed_at: healedAt } : s))
    );
    setJustHealed(sore);
    notify('success');
  };

  const save = async () => {
    setSaving(true);
    // Whether this Save writes the day log, fixed now: the log can be
    // edited again while the request is in flight.
    const logWritten = logDirty;
    try {
      const toWrite = sores.filter((s) => changed.has(s.id));
      const [soreResult, logResult] = await Promise.all([
        toWrite.length
          ? upsertSores(toWrite, localTimeZone())
          : Promise.resolve({ ok: true as const }),
        logWritten ? saveDayLog(log) : Promise.resolve({ ok: true as const })
      ]);
      const failure = [soreResult, logResult].find((r) => !r.ok);
      if (failure && !failure.ok) {
        notify('error');
        toast({ variant: 'destructive', title: failure.error });
        return;
      }
      setSavedSores(sores);
      setSavedLogs((prev) => withSavedLog(prev, log, logWritten));
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
        top bar already says that. The block reads saved data only.
      */}
      {now ? (
        <StreakBlock
          sores={savedSores}
          logs={savedLogs}
          now={now}
          answer={answer}
        />
      ) : (
        <StreakBlockPlaceholder mood={expectedMood} answer={answer} />
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 lg:mt-6">
        {justHealed && (
          <HealedNote
            key={justHealed.id}
            sore={justHealed}
            onDismiss={() => setJustHealed(null)}
          />
        )}
        {/*
          With nothing open there is no list, and the answer line has already
          said so. What is left is the one action, and which verb it wants
          depends on whether this person has ever logged anything: a first
          mark and a next mark are different invitations.
        */}
        {open.length === 0 ? (
          <div className="surface-worksheet flex flex-col items-start gap-3 p-4 sm:p-5">
            {/* One Kanko at a time: the medal above has the moment. */}
            {!justHealed && <Kanko mood="curious" size={120} />}
            <p className="prose-measure">
              {sores.length === 0
                ? 'The map is where a sore starts. It takes about fifteen seconds.'
                : 'Logging what you ate and how you slept is still worth doing. It is how patterns show up on the days between sores.'}
            </p>
            <Button
              asChild
              variant="outline"
              size="touch"
              className="w-full sm:w-auto"
            >
              <Link href="/my-sores?add">
                {sores.length === 0
                  ? 'Mark your first sore'
                  : 'Mark a new sore'}
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
          <p
            aria-live="polite"
            className="min-w-0 flex-1 text-sm text-muted-foreground"
          >
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
              {saving && (
                <Loader2 className="animate-spin" aria-hidden="true" />
              )}
              {saving ? 'Saving' : 'Save today'}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

/**
 * Credit for a sore that has closed: Kanko with a medal and one plain line.
 * It eases in, unless the person has asked for less motion. No card fill:
 * the dark medal art is drawn on the page colour, not the card colour.
 */
function HealedNote({
  sore,
  onDismiss
}: {
  sore: Sore;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      className="flex items-center gap-4 rounded-worksheet border border-border p-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-500 sm:p-5"
    >
      <Kanko mood="medal" size={96} className="size-24 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-subhead">Healed. Nice work.</p>
        <p className="prose-measure mt-1 text-muted-foreground">
          Your {sore.zone.toLowerCase()} sore is closed. Its whole course stays
          in your history.
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 self-start"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}

/*
 * The device clock as a store: null during the server render and hydration,
 * then one Date for as long as the screen stays mounted. Dropped on unmount,
 * so coming back to Today tomorrow reads the clock again.
 */
let deviceNow: Date | null = null;
const subscribeToNow = () => () => {
  deviceNow = null;
};
const readDeviceNow = () => (deviceNow ??= new Date());
const readServerNow = () => null;
const useDeviceNow = () =>
  useSyncExternalStore(subscribeToNow, readDeviceNow, readServerNow);

const blankLog = (day: string): DayLog => ({
  day,
  triggers: [],
  treatments: [],
  note: null
});

/** "2 triggers", or nothing for none. */
const count = (n: number, noun: string) =>
  n ? `${n} ${noun}${n === 1 ? '' : 's'}` : null;
