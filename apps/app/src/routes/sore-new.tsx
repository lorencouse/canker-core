import { createRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  isDateKey,
  newSoreSchema,
  PAIN_ANCHORS,
  PAIN_MAX,
  PAIN_MIN,
  SIZE_MAX_MM,
  SIZE_MIN_MM,
  sizeReference,
  SORE_SURFACES,
  SURFACE_LABELS,
  type DateKey,
  type SoreSurface
} from '@canker/core';
import { Button, Input, Label, LevelSlider, MouthMap, Textarea } from '@canker/ui';
import { authedRoute } from '@/router-base';
import { useCreateSore, useDataset, useToday } from '@/lib/data';
import { healedBy, painOn, soresOn } from '@/lib/derive';
import { PageHeader } from '@/components/page-header';

export const soreNewRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/sores/new',
  validateSearch: (s: Record<string, unknown>): { date?: DateKey } => ({
    date: isDateKey(s.date) ? s.date : undefined
  }),
  component: NewSorePage
});

/**
 * Two steps: place it, then describe it. Placing is a tap on a surface (zooms
 * in) followed by a tap at the spot. A list fallback exists for people who
 * can't tell where it is on the drawing.
 */
function NewSorePage() {
  const today = useToday();
  const { date: param } = soreNewRoute.useSearch();
  const onset = param && param <= today ? param : today;
  const navigate = useNavigate();
  const data = useDataset().data;
  const create = useCreateSore();

  const [step, setStep] = useState<'place' | 'details'>('place');
  const [surface, setSurface] = useState<SoreSurface | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [onsetDate, setOnsetDate] = useState<DateKey>(onset);
  const [size, setSize] = useState(3);
  const [pain, setPain] = useState(3);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const existing = data
    ? soresOn(data, onset).map((s) => ({
        id: s.id,
        surface: s.surface,
        x: s.x,
        y: s.y,
        pain: painOn(s.logs, onset),
        healed: healedBy(s, onset)
      }))
    : [];

  function save() {
    if (!surface || !pos) return setError('Pick where the sore is first.');
    const parsed = newSoreSchema.safeParse({
      surface,
      x: pos.x,
      y: pos.y,
      onset_date: onsetDate,
      size_mm: size,
      pain,
      notes: notes.trim() || null
    });
    if (!parsed.success)
      return setError(parsed.error.issues[0]?.message ?? 'Check the details');
    create.mutate(parsed.data);
    void navigate({
      to: '/today',
      search: onsetDate === today ? {} : { date: onsetDate }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={step === 'place' ? 'Where is it?' : 'How is it today?'}
        subtitle={
          step === 'place'
            ? 'Tap the area, then tap the exact spot.'
            : surface
              ? SURFACE_LABELS[surface]
              : undefined
        }
        right={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back"
            onClick={() =>
              step === 'details'
                ? setStep('place')
                : void navigate({ to: '/today', search: {} })
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      {step === 'place' ? (
        <>
          <MouthMap
            className="border-border bg-card mx-auto w-full max-w-md rounded-xl border"
            mode="place"
            sores={existing}
            selectedSurface={surface}
            zoomTo={surface}
            onSelectSurface={(s) => {
              setSurface(s);
              setPos(null);
            }}
            onPlace={(s, x, y) => {
              setSurface(s);
              setPos({ x, y });
            }}
          />
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-secondary-foreground text-sm">
                {surface
                  ? pos
                    ? `Placed on ${SURFACE_LABELS[surface].toLowerCase()}`
                    : `Now tap the spot on ${SURFACE_LABELS[surface].toLowerCase()}`
                  : 'Nothing selected yet'}
              </p>
              {surface ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSurface(null);
                    setPos(null);
                  }}
                >
                  Zoom out
                </Button>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="surface-list" className="text-muted-foreground text-xs">
                Or choose from a list
              </Label>
              <select
                id="surface-list"
                className="border-input bg-card h-10 rounded-md border px-3 text-sm"
                value={surface ?? ''}
                onChange={(e) => {
                  const v = e.target.value as SoreSurface | '';
                  if (!v) return;
                  setSurface(v);
                  setPos({ x: 0.5, y: 0.5 });
                }}
              >
                <option value="">Pick a location…</option>
                {SORE_SURFACES.map((s) => (
                  <option key={s} value={s}>
                    {SURFACE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            {error ? (
              <p role="alert" className="text-accent text-sm">
                {error}
              </p>
            ) : null}
            <Button
              size="lg"
              disabled={!surface || !pos}
              onClick={() => {
                setError(null);
                setStep('details');
              }}
            >
              Next
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="onset">When did it appear?</Label>
            <Input
              id="onset"
              type="date"
              max={today}
              value={onsetDate}
              onChange={(e) => isDateKey(e.target.value) && setOnsetDate(e.target.value)}
            />
          </div>
          <LevelSlider
            label="Size"
            value={size}
            min={SIZE_MIN_MM}
            max={SIZE_MAX_MM}
            step={1}
            onChange={setSize}
            format={(v) => `${v} mm`}
            anchors={[{ at: SIZE_MIN_MM, label: sizeReference(size) }]}
          />
          <LevelSlider
            label="Pain"
            value={pain}
            min={PAIN_MIN}
            max={PAIN_MAX}
            step={1}
            onChange={setPain}
            anchors={PAIN_ANCHORS}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bit my cheek two days ago, new toothpaste, anything"
            />
          </div>
          {error ? (
            <p role="alert" className="text-accent text-sm">
              {error}
            </p>
          ) : null}
          <Button size="lg" onClick={save} disabled={create.isPending}>
            Save sore
          </Button>
        </div>
      )}
    </div>
  );
}
