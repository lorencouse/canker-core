'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, Loader2, Plus } from 'lucide-react';

import Kanko from '@/components/kanko/Kanko';
import MouthMap from '@/components/mouth-map/MouthMap';
import SoreSigil from '@/components/sore/SoreSigil';
import DayLogForm from '@/components/today/DayLogForm';
import StreakBlock, {
  StreakBlockPlaceholder
} from '@/components/today/StreakBlock';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/Toasts/use-toast';
import { SoreProvider, useSoreContext } from '@/context/SoreContext';
import type { DayLog, Sore, User } from '@/types';
import { answerLine } from '@/utils/course';
import { saveDayLog, upsertSores } from '@/utils/actions/soreActions';
import { cn } from '@/utils/cn';
import { emptyDayLog } from '@/utils/day-log';
import { useUnsavedGuard } from '@/utils/hooks/useUnsavedGuard';
import { MOUTH_VIEWS, type MouthView } from '@/utils/mouth-map/geometry';
import { notify, tap } from '@/utils/native';
import { type Mood, withSavedLog } from '@/utils/momentum';
import {
  addDays,
  currentPain,
  currentSize,
  dayKey,
  dayNumberOf,
  hasReadingOn,
  isSameLocalDay,
  latestReading,
  localTimeZone,
  withReading
} from '@/utils/readings';

/**
 * The daily check-in.
 *
 * The mouth diagram leads, so every open sore's place and size is seen at
 * once; a short list under it says which still want today's reading. A tap
 * on a sore, in either, opens its quick card: same as yesterday, update or
 * healed, each written as it is pressed. Below that is the day's log, the
 * one part still saved by hand, because chips and a note are edited in
 * several taps that should land together.
 */
export default function TodayScreen({
  user,
  sores,
  dayLogs,
  expectedMood
}: {
  user: User;
  sores: Sore[];
  dayLogs: DayLog[];
  /** The server's guess at the block's mood; sizes the placeholder only. */
  expectedMood: Mood;
}) {
  return (
    <SoreProvider initialSores={sores}>
      <Today user={user} dayLogs={dayLogs} expectedMood={expectedMood} />
    </SoreProvider>
  );
}

function Today({
  user,
  dayLogs,
  expectedMood
}: {
  user: User;
  dayLogs: DayLog[];
  expectedMood: Mood;
}) {
  const router = useRouter();
  const { sores, setSores, setSelectedSore, setQuickOpen } = useSoreContext();
  /*
   * Which day it is belongs to the device, not the server: a server on UTC
   * is already on tomorrow during a US evening. So the clock is read on the
   * device, once per visit, and everything keyed to the day waits for it.
   */
  const now = useDeviceNow();
  const today = now ? dayKey(now) : null;

  const [savedLogs, setSavedLogs] = useState(dayLogs);
  const [editedLog, setEditedLog] = useState<DayLog | null>(null);
  const log =
    editedLog ??
    (today
      ? (dayLogs.find((l) => l.day === today) ?? emptyDayLog(today))
      : emptyDayLog(''));
  const [logDirty, setLogDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  useUnsavedGuard(logDirty);

  const open = useMemo(() => sores.filter((s) => !s.healed_at), [sores]);
  const answer = useMemo(() => answerLine(sores), [sores]);

  /*
   * Kanko takes the medal on a day a sore closed. Derived from the sores
   * rather than kept as an event, so it survives the quick card closing.
   */
  const healedToday =
    now !== null &&
    sores.some((s) => s.healed_at && isSameLocalDay(s.healed_at, now));

  /*
   * Open on the view holding the most open sores, so the diagram is not
   * empty when they are all on the cheeks. Chosen once: a heal from the
   * quick card must not move the map off the view the user is on.
   */
  const [busiestView] = useState<MouthView>(() => {
    const count = (v: MouthView) => open.filter((s) => s.view === v).length;
    return MOUTH_VIEWS.reduce((a, b) => (count(b) > count(a) ? b : a));
  });

  /*
   * The open sores still waiting for today's reading that have a last one
   * to repeat. With two or more, one tap says "nothing changed" for all of
   * them, which is the commonest morning there is.
   */
  const repeatable = useMemo(
    () =>
      now ? open.filter((s) => !hasReadingOn(s, now) && latestReading(s)) : [],
    [open, now]
  );
  const allSame = async () => {
    tap();
    const updated = repeatable.map((s) => withReading(s, {}));
    setBulkBusy(true);
    try {
      const result = await upsertSores(updated, localTimeZone());
      if (!result.ok) {
        notify('error');
        toast({ variant: 'destructive', title: result.error });
        return;
      }
      const byId = new Map(updated.map((s) => [s.id, s]));
      setSores((prev) => prev.map((s) => byId.get(s.id) ?? s));
      notify('success');
      toast({ title: `Logged ${updated.length} sores as unchanged.` });
    } finally {
      setBulkBusy(false);
    }
  };

  const yesterdaysTreatments = useMemo(() => {
    if (!now) return [];
    const yesterday = dayKey(addDays(now, -1));
    return dayLogs.find((l) => l.day === yesterday)?.treatments ?? [];
  }, [dayLogs, now]);

  const updateLog = (next: DayLog) => {
    setEditedLog(next);
    setLogDirty(true);
    setSaved(false);
  };

  const saveLog = async () => {
    setSaving(true);
    try {
      const result = await saveDayLog(log);
      if (!result.ok) {
        notify('error');
        toast({ variant: 'destructive', title: result.error });
        return;
      }
      setSavedLogs((prev) => withSavedLog(
          prev,
          { ...log, food_answered: true, health_answered: true },
          true
        ));
      setLogDirty(false);
      setSaved(true);
      notify('success');
      toast({ title: 'Saved today’s log.' });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const openSore = (sore: Sore) => {
    tap();
    setSelectedSore(sore);
    setQuickOpen(true);
  };

  return (
    <div
      className={cn(
        'mx-auto max-w-6xl px-4 py-5 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-x-8 lg:px-6 lg:py-9',
        // Room under the last field for the Save bar that floats over it.
        logDirty && 'pb-28 lg:pb-9'
      )}
    >
      <div className="min-w-0">
        {now ? (
          <StreakBlock
            sores={sores}
            logs={savedLogs}
            now={now}
            answer={answer}
            celebrate={healedToday ? 'medal' : undefined}
          />
        ) : (
          <StreakBlockPlaceholder mood={expectedMood} answer={answer} />
        )}

        {open.length === 0 ? (
          <div className="surface-worksheet mt-5 flex flex-col items-start gap-3 p-4 sm:p-5">
            {!healedToday && <Kanko mood="curious" size={120} />}
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
          <div className="mt-5 grid grid-cols-1 gap-4">
            {repeatable.length >= 2 && (
              <Button
                type="button"
                variant="outline"
                size="touch"
                className="w-full"
                onClick={allSame}
                disabled={bulkBusy}
              >
                {bulkBusy ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Check aria-hidden="true" />
                )}
                {repeatable.every(lastWasYesterday)
                  ? 'All the same as yesterday'
                  : 'All the same as last time'}
              </Button>
            )}

            <MouthMap user={user} initialView={busiestView} />

            <section
              aria-labelledby="open-sores"
              className="surface-worksheet p-4 sm:p-5"
            >
              <h2 id="open-sores" className="text-section">
                Open sores
              </h2>
              <ul className="mt-1">
                {open.map((sore) => {
                  const logged = now ? hasReadingOn(sore, now) : false;
                  return (
                    <li
                      key={sore.id}
                      className="border-t border-border first:border-t-0"
                    >
                      <button
                        type="button"
                        onClick={() => openSore(sore)}
                        className="grid min-h-14 w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 py-2.5 text-left hover:bg-muted"
                      >
                        <SoreSigil sore={sore} size={28} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">
                            {sore.zone}
                          </span>
                          <span className="tabular block truncate text-sm text-muted-foreground">
                            {now && `Day ${dayNumberOf(sore, now)} · `}
                            {currentSize(sore)} mm, pain {currentPain(sore)}
                          </span>
                        </span>
                        <span
                          className={cn(
                            'whitespace-nowrap text-sm',
                            logged
                              ? 'text-muted-foreground'
                              : 'font-semibold text-foreground'
                          )}
                        >
                          {logged ? 'Logged' : 'Log today'}
                        </span>
                        <ChevronRight
                          aria-hidden="true"
                          className="size-5 text-muted-foreground"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Button
                asChild
                variant="link"
                className="mt-1 h-11 px-0.5 text-base font-semibold"
              >
                <Link href="/my-sores?add">
                  <Plus aria-hidden="true" />
                  Mark a new sore
                </Link>
              </Button>
            </section>
          </div>
        )}
      </div>

      {/*
        A rail beside the sores on a desktop, sticky so Save stays in reach;
        a plain section under them on a phone.
      */}
      <section
        aria-labelledby="day-log"
        className="mt-8 lg:surface-worksheet lg:sticky lg:top-[calc(var(--app-bar-h)+var(--safe-top)+1.5rem)] lg:mt-6 lg:p-5"
      >
        <h2 id="day-log" className="text-xl">
          What else happened today?
        </h2>
        <div className="mt-3.5">
          <DayLogForm
            log={log}
            onChange={updateLog}
            yesterdaysTreatments={yesterdaysTreatments}
          />
        </div>

        {/*
          On a phone Save floats above the tab bar, but only while there is
          something to save. Inside the rail on a desktop.
        */}
        <div
          className={cn(
            'mt-5 flex items-center gap-3',
            logDirty &&
              'fixed inset-x-0 bottom-[calc(var(--tab-bar-h)+var(--safe-bottom))] z-30 mt-0 border-t border-border bg-background px-4 py-2.5 lg:static lg:z-auto lg:mt-5 lg:border-0 lg:bg-transparent lg:p-0'
          )}
        >
          <p
            aria-live="polite"
            className="min-w-0 flex-1 text-sm text-muted-foreground"
          >
            {logDirty
              ? logSummary(log)
              : saved
                ? 'Saved.'
                : 'Nothing to save yet.'}
          </p>
          {logDirty && (
            <Button
              type="button"
              size="touch"
              className="shrink-0"
              disabled={saving}
              onClick={() => {
                tap();
                saveLog();
              }}
            >
              {saving && (
                <Loader2 className="animate-spin" aria-hidden="true" />
              )}
              {saving ? 'Saving' : 'Save log'}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

/** Whether the sore's last reading was taken yesterday. */
function lastWasYesterday(sore: Sore): boolean {
  const last = latestReading(sore);
  if (!last) return false;
  return isSameLocalDay(last.recorded_at, addDays(new Date(), -1));
}

/** "2 triggers, 1 treatment, a note": what Save is about to write. */
function logSummary(log: DayLog): string {
  return (
    [
      count(log.triggers.length, 'trigger'),
      count(log.treatments.length, 'treatment'),
      log.note ? 'a note' : null
    ]
      .filter(Boolean)
      .join(', ') || 'Today’s log'
  );
}

/*
 * The device clock as a store: null during the server render and hydration,
 * then one Date for as long as the screen stays mounted.
 */
let deviceNow: Date | null = null;
const subscribeToNow = () => () => {
  deviceNow = null;
};
const readDeviceNow = () => (deviceNow ??= new Date());
const readServerNow = () => null;
const useDeviceNow = () =>
  useSyncExternalStore(subscribeToNow, readDeviceNow, readServerNow);

const count = (n: number, noun: string) =>
  n ? `${n} ${noun}${n === 1 ? '' : 's'}` : null;
