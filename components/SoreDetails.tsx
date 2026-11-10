'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { useSoreContext } from '@/context/SoreContext';
import SoreActions, { EditingBar } from '@/components/mouth-map/SoreActionBar';
import SoreSliders from '@/components/mouth-map/SoreSliders';
import CourseBars from '@/components/sore/CourseBars';
import LongSoreNote from '@/components/sore/LongSoreNote';
import Measure from '@/components/sore/Measure';
import SoreRow from '@/components/sore/SoreRow';
import SoreSigil from '@/components/sore/SoreSigil';
import type { Sore } from '@/types';
import { courseOf, verdictOf } from '@/utils/course';
import { shortDate } from '@/utils/dates';
import { useMounted } from '@/utils/hooks/useMounted';
import { isLongRunning, LONG_SORE_DAYS } from '@/utils/insights';
import { NEARBY_MM, nearbySores } from '@/utils/mouth-map/nearby';
import {
  currentPain,
  currentSize,
  dayNumberOf,
  hasReadingOn,
  latestReading
} from '@/utils/readings';
import { photoFor, photosSupported } from '@/utils/sore-photos';
import { sevFill } from '@/utils/severity';

/**
 * The selected sore, inline beside the map on a desktop and under it on a
 * phone.
 *
 * It answers "how is this one doing" in the order a person asks it: the
 * verdict, the four figures behind it, the course drawn to scale, the sore
 * at actual size, then what to do. Last comes the map's own question, place
 * against time: has a sore been here before?
 */

function Figure({
  label,
  value,
  unit
}: {
  label: string;
  value: ReactNode;
  unit: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="tabular mt-0.5 truncate font-display text-xl font-semibold leading-tight">
        <Measure
          value={value}
          unit={unit}
          className="text-sm font-medium text-muted-foreground"
        />
      </dd>
    </div>
  );
}

/**
 * The sore's photos, oldest first, from this device's own storage. Nothing
 * renders on the web, where there are none, or when no reading has one.
 */
function SorePhotos({ sore, now }: { sore: Sore; now: Date }) {
  const supported = useMounted() && photosSupported();
  const [photos, setPhotos] = useState<
    { id: string; at: string; src: string }[]
  >([]);

  useEffect(() => {
    if (!photosSupported()) return;
    let live = true;
    Promise.all(
      sore.readings.map(async (r) => ({
        id: r.id,
        at: r.recorded_at,
        src: await photoFor(r.id)
      }))
    ).then((found) => {
      if (!live) return;
      setPhotos(
        found.filter((p): p is { id: string; at: string; src: string } =>
          Boolean(p.src)
        )
      );
    });
    return () => {
      live = false;
    };
  }, [sore.readings]);

  if (!supported || photos.length === 0) return null;

  return (
    <div className="mt-5">
      <h3 className="font-sans text-base font-semibold tracking-normal">
        Photos on this phone
      </h3>
      <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((p) => (
          <li key={p.id} className="min-w-0">
            <figure>
              {/* A file on this device; next/image cannot reach it. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt={`The sore on ${shortDate(new Date(p.at), now)}`}
                className="aspect-square w-full rounded-xl object-cover"
              />
              <figcaption className="tabular mt-1 truncate text-sm text-muted-foreground">
                {shortDate(new Date(p.at), now)}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </div>
  );
}

function metaLine(sore: Sore, now: Date) {
  if (sore.healed_at)
    return `Healed ${shortDate(new Date(sore.healed_at), now)}`;
  const day = dayNumberOf(sore, now);
  return day > LONG_SORE_DAYS
    ? `Day ${day}, past two weeks`
    : `Day ${day} of about 14`;
}

export function SoreDetail() {
  const { selectedSore: sore, sores, mode } = useSoreContext();
  const now = useMemo(() => new Date(), []);
  const nearby = useMemo(
    () => (sore ? nearbySores(sore, sores) : []),
    [sore, sores]
  );

  if (!sore) return null;

  const verdict = verdictOf(sore, now);
  const today = hasReadingOn(sore, now);
  const size = currentSize(sore);
  const pain = currentPain(sore);
  const days = courseOf(sore, now);
  const logged = days.filter((d) => d.size !== null);
  const widest = logged.reduce<(typeof logged)[number] | null>(
    (a, d) => (!a || d.size! > a.size! ? d : a),
    null
  );
  const note = latestReading(sore)?.note;

  return (
    <section
      aria-labelledby="sore-detail"
      className="surface-worksheet p-4 sm:p-5"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2
          id="sore-detail"
          className="flex min-w-0 items-center gap-2.5 text-section"
        >
          <SoreSigil sore={sore} size={30} />
          <span className="truncate">{sore.zone}</span>
        </h2>
        <p className="tabular text-sm text-muted-foreground">
          {metaLine(sore, now)}
        </p>
      </header>
      <p className="mt-2 text-lg leading-snug">
        <b className="font-semibold">{verdict.word}</b> {verdict.detail}
      </p>

      {mode !== 'view' && (
        <div className="mt-4 space-y-3">
          <SoreSliders />
          <EditingBar place="detail" />
        </div>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5 sm:grid-cols-4">
        <Figure
          label={today ? 'Width today' : 'Last width'}
          value={size}
          unit="mm"
        />
        <Figure
          label={today ? 'Pain today' : 'Last pain'}
          value={pain}
          unit="of 10"
        />
        <Figure
          label="Widest"
          value={widest?.size ?? '—'}
          unit={widest ? `mm, day ${widest.n}` : ''}
        />
        <Figure
          label="Readings"
          value={logged.length}
          unit={`of ${days.length} day${days.length === 1 ? '' : 's'}`}
        />
      </dl>

      <div className="mt-5">
        <h3 className="font-sans text-base font-semibold tracking-normal">
          Width by day, in mm
        </h3>
        <CourseBars sore={sore} axis height={120} now={now} className="mt-2" />
      </div>

      {/*
        Sized in CSS millimetres, so on most screens the dot is close to the
        sore's real size, which is the point of showing it at all.
      */}
      <div className="mt-4 flex items-center gap-3 bg-secondary p-3">
        <span className="flex min-h-12 min-w-12 shrink-0 items-center justify-center">
          <span
            className="block rounded-full"
            style={{
              width: `${size}mm`,
              height: `${size}mm`,
              backgroundColor: sevFill(pain)
            }}
          />
        </span>
        <p className="text-base">Actual size: {size} mm across.</p>
      </div>

      {note && (
        <p className="mt-4 text-base">
          <span className="text-muted-foreground">Latest note: </span>
          {note}
        </p>
      )}
      {isLongRunning(sore) && <LongSoreNote className="mt-4" />}

      <SorePhotos sore={sore} now={now} />

      <div className="mt-4">
        <SoreActions />
      </div>

      {nearby.length > 0 && (
        <div className="mt-5">
          <h3 className="font-sans text-base font-semibold tracking-normal">
            Sores near this spot before
          </h3>
          <p className="mt-1 text-base text-muted-foreground">
            {nearby.length} earlier sore{nearby.length === 1 ? '' : 's'} within{' '}
            {NEARBY_MM} mm. Sores that return to one point usually have a local
            cause, like a sharp tooth or a habit.
          </p>
          <ul className="mt-2">
            {nearby.slice(0, 5).map((other) => {
              const course = courseOf(other, now);
              const sizes = other.readings.map((r) => r.size);
              return (
                <li
                  key={other.id}
                  className="tabular grid min-h-12 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-t border-border text-base"
                >
                  <span className="truncate">
                    {other.zone}, {shortDate(new Date(other.created_at), now)}
                  </span>
                  <span className="text-muted-foreground">
                    {course.length} days
                  </span>
                  <span className="text-muted-foreground">
                    {sizes.length
                      ? `widest ${Math.max(...sizes)} mm`
                      : 'no readings'}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

/**
 * What the detail column holds when no sore is selected: the open sores,
 * each with its fortnight and one tap from its course, then the last few
 * that healed. An empty column saying "No sore selected" was half the
 * desktop screen spent on nothing.
 */
export function OpenSoresList() {
  const { sores, setSelectedSore, setShowHealed, mode } = useSoreContext();
  const now = useMemo(() => new Date(), []);
  const open = sores.filter((s) => !s.healed_at);
  const healed = sores
    .filter((s) => s.healed_at)
    .sort(
      (a, b) =>
        new Date(b.healed_at!).getTime() - new Date(a.healed_at!).getTime()
    )
    .slice(0, 3);

  if (mode === 'add') return null;

  return (
    <section
      aria-labelledby="open-sores"
      className="surface-worksheet p-4 sm:p-5"
    >
      <h2 id="open-sores" className="text-section">
        Open sores
      </h2>
      {open.length === 0 ? (
        <p className="prose-measure mt-2 text-muted-foreground">
          Nothing open. When one appears, mark it on the map and its course
          starts here.
        </p>
      ) : (
        <ul className="mt-2">
          {open.map((sore) => (
            <li
              key={sore.id}
              className="border-t border-border first:border-t-0"
            >
              <SoreRow
                sore={sore}
                now={now}
                onClick={() => setSelectedSore(sore)}
                className="grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 gap-y-2 py-3"
                below={
                  <CourseBars
                    sore={sore}
                    height={36}
                    now={now}
                    className="col-start-2"
                  />
                }
              />
            </li>
          ))}
        </ul>
      )}

      {healed.length > 0 && (
        <div className="mt-5">
          <h3 className="font-sans text-base font-semibold tracking-normal">
            Recently healed
          </h3>
          <ul className="mt-1">
            {healed.map((sore) => (
              <li
                key={sore.id}
                className="border-t border-border first:border-t-0"
              >
                <button
                  type="button"
                  onClick={() => {
                    // A healed sore is hidden on the map until healed ones show.
                    setShowHealed(true);
                    setSelectedSore(sore);
                  }}
                  className="tabular grid min-h-12 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-left hover:bg-muted"
                >
                  <span className="truncate">{sore.zone}</span>
                  <span className="text-sm text-muted-foreground">
                    {dayNumberOf(sore, now)} days, healed{' '}
                    {shortDate(new Date(sore.healed_at!), now)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
