'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import { Capacitor } from '@capacitor/core';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

import CheckInFlow from '@/components/check-in/CheckInFlow';
import CheckInHost from '@/components/check-in/CheckInHost';
import {
  SparkleField,
  SparkleMark,
  StarMark,
  type Sparkle
} from '@/components/graphics/Sparkles';
import Kanko from '@/components/kanko/Kanko';
import LargeTitle from '@/components/shell/LargeTitle';
import OpenSoreRow from '@/components/today/OpenSoreRow';
import SwipeRow from '@/components/sore/SwipeRow';
import { useHealSore } from '@/components/sore/useHealSore';
import ReminderOffer from '@/components/today/ReminderOffer';
import StreakCard from '@/components/today/StreakCard';
import WeekTiles from '@/components/today/WeekTiles';
import { Button } from '@/components/ui/button';
import type { CheckIn, DayLog, Sore } from '@/types';
import { cn } from '@/utils/cn';
import { dayKey, isSameLocalDay } from '@/utils/days';
import { isNative, tap } from '@/utils/native';
import type { Mood } from '@/utils/momentum';

/** Two marks on the Check in button once the day is done: a small win. */
const DONE_SPARKLES: Sparkle[] = [
  { top: '-14%', left: '88%', size: 14, delay: 0 },
  { top: '64%', left: '4%', size: 10, tone: 'comfort', delay: 1.1 }
];

/**
 * Today: a one-screen status. Kanko and the streak in one card, the one
 * button that opens the check-in, the open sores as compact rows, and the
 * week in three figures.
 *
 * Logging lives in the check-in and the map lives on the Map tab, so this
 * screen only reports. The check-in opens from the button, or from the
 * reminder's link (`?checkin=1`); it no longer opens by itself on every
 * visit, which put a full-screen takeover in front of the day.
 */
export default function TodayScreen({
  sores: serverSores,
  dayLogs,
  checkIns,
  openCheckIn,
  expectedMood
}: {
  sores: Sore[];
  dayLogs: DayLog[];
  /** The last few days' check-ins, newest first. */
  checkIns: CheckIn[];
  /** Arrived by the check-in link: open it whether or not today is done. */
  openCheckIn: boolean;
  /** The server's guess at the card's mood; draws Kanko before the clock is read. */
  expectedMood: Mood;
}) {
  const router = useRouter();
  /*
   * Sores healed or reopened here (a swipe, its Undo), ahead of the
   * server's copy, which catches up on the next refresh.
   */
  const [edited, setEdited] = useState<Record<string, Sore>>({});
  const sores = useMemo(
    () => serverSores.map((s) => edited[s.id] ?? s),
    [serverSores, edited]
  );
  const heal = useHealSore((next) =>
    setEdited((prev) => ({ ...prev, [next.id]: next }))
  );
  /*
   * Which day it is belongs to the device, not the server: a server on UTC
   * is already on tomorrow during a US evening. So the clock is read on the
   * device, once per visit, and everything keyed to the day waits for it.
   */
  const now = useDeviceNow();
  const today = now ? dayKey(now) : null;

  /*
   * The check-in, while open. `day` is the day it opened on, which is the
   * day its outcome is recorded against.
   */
  const [checkIn, setCheckIn] = useState<{ day: string } | null>(null);
  // Outcomes recorded since this page loaded, ahead of the server's list.
  const [recorded, setRecorded] = useState<CheckIn[]>([]);
  const allCheckIns = useMemo(
    () => [...recorded, ...checkIns],
    [recorded, checkIns]
  );
  // Done wins: skipping a reopened, finished day leaves it finished.
  const todayDone =
    today !== null &&
    allCheckIns.some((c) => c.day === today && c.status === 'done');

  // The reminder's link opens the check-in once, then tidies the URL.
  const linkHandled = useRef(false);
  useEffect(() => {
    if (!openCheckIn) {
      linkHandled.current = false;
      return;
    }
    if (!now || linkHandled.current) return;
    linkHandled.current = true;
    setCheckIn((open) => open ?? { day: dayKey(new Date()) });
    router.replace('/today', { scroll: false });
  }, [openCheckIn, now, router]);

  /*
   * Back in the foreground: refresh, so a check-in finished on another
   * device shows here.
   */
  useEffect(() => {
    if (!isNative() || !Capacitor.isPluginAvailable('App')) return;
    let remove: (() => void) | undefined;
    let gone = false;
    (async () => {
      const { App } = await import('@capacitor/app');
      const handle = await App.addListener('resume', () => router.refresh());
      if (gone) handle.remove();
      else remove = () => handle.remove();
    })().catch((error) => console.error('resume listener failed', error));
    return () => {
      gone = true;
      remove?.();
    };
  }, [router]);

  // The check-in kept its own copy of the data: refetch once it closes.
  const closeCheckIn = (result: 'done' | 'skipped' | 'left') => {
    const day = checkIn?.day;
    setCheckIn(null);
    if (day && result !== 'left') {
      setRecorded((prev) => [{ day, status: result }, ...prev]);
    }
    router.refresh();
  };

  const startCheckIn = () => {
    tap();
    setCheckIn({ day: dayKey(new Date()) });
  };

  const open = useMemo(() => sores.filter((s) => !s.healed_at), [sores]);

  // Kanko takes the medal on a day a sore closed.
  const healedToday =
    now !== null &&
    sores.some((s) => s.healed_at && isSameLocalDay(s.healed_at, now));

  const dateLine = now
    ? now.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })
    : ' ';

  return (
    <div
      className={cn(
        // On a spanned Duo the status takes the first screen and the sores
        // the second (THE FOLD in styles/main.css).
        'fold-shell fold-split mx-auto max-w-6xl px-4 py-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-x-8 lg:px-6 lg:py-8'
      )}
    >
      <div className="min-w-0">
        <LargeTitle overline={dateLine}>Today</LargeTitle>

        <StreakCard
          className="mt-3"
          sores={sores}
          logs={dayLogs}
          now={now}
          expectedMood={expectedMood}
          celebrate={healedToday ? 'medal' : undefined}
        />

        <div className="relative mt-3">
          <Button
            type="button"
            size="touch"
            variant={todayDone ? 'outline' : 'default'}
            className="w-full"
            disabled={!now}
            onClick={startCheckIn}
            aria-label={todayDone ? 'Checked in. Edit today’s check-in' : undefined}
          >
            {todayDone ? (
              <StarMark size={18} className="text-win" />
            ) : (
              <SparkleMark size={16} />
            )}
            {todayDone ? 'Checked in' : 'Check in'}
          </Button>
          {todayDone && <SparkleField sparkles={DONE_SPARKLES} />}
        </div>

        <ReminderOffer />
      </div>

      <div className="min-w-0">
        <section aria-labelledby="open-sores" className="mt-6 lg:mt-0">
          <h2
            id="open-sores"
            className="tabular px-1 text-sm font-semibold text-muted-foreground"
          >
            {open.length > 0 ? `Open · ${open.length}` : 'Open'}
          </h2>
          {open.length === 0 ? (
            <div className="surface-worksheet mt-2 flex items-center gap-3 p-3">
              <Kanko mood="curious" size={56} className="size-14 shrink-0" />
              <p className="min-w-0 flex-1 font-semibold">
                {sores.length === 0 ? 'No sores yet' : 'Nothing open'}
              </p>
              <Button asChild variant="outline" size="touch" className="shrink-0">
                <Link href="/my-sores?add">
                  <Plus aria-hidden="true" />
                  Mark one
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="surface-worksheet mt-2 px-2 py-1">
              {open.map((sore) => (
                <li
                  key={sore.id}
                  className="border-t border-border first:border-t-0"
                >
                  <SwipeRow
                    className="rounded-cell"
                    onHealed={() => heal.setHealed(sore, new Date().toISOString())}
                    onLog={() =>
                      router.push(
                        `/my-sores?sore=${encodeURIComponent(sore.id)}&log`
                      )
                    }
                  >
                    <OpenSoreRow sore={sore} now={now} />
                  </SwipeRow>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="this-week" className="mt-6">
          <h2
            id="this-week"
            className="px-1 text-sm font-semibold text-muted-foreground"
          >
            This week
          </h2>
          <div className="mt-2">
            <WeekTiles logs={dayLogs} today={today} />
          </div>
        </section>
      </div>

      {checkIn && (
        <CheckInHost>
          <CheckInFlow sores={sores} dayLogs={dayLogs} onClose={closeCheckIn} />
        </CheckInHost>
      )}
    </div>
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

