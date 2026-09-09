import { useState, type FormEvent } from 'react';
import {
  FACTOR_KIND_LABELS,
  FACTOR_KINDS,
  newFactorSchema,
  type DateKey,
  type Factor,
  type FactorKind,
  type UserDataset
} from '@canker/core';
import {
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label
} from '@canker/ui';
import { useCreateFactor, useToggleFactor } from '@/lib/data';
import { factorIdsOn, factorsByUsage } from '@/lib/derive';

const SHORTLIST = 10;

/**
 * Tap-to-toggle factors for a day. The shortlist is ordered by how often the
 * user logs each factor, so the ones that matter drift to the front.
 */
export function FactorChips({ data, date }: { data: UserDataset; date: DateKey }) {
  const toggle = useToggleFactor();
  const [showAll, setShowAll] = useState(false);
  const [adding, setAdding] = useState(false);

  const on = factorIdsOn(data, date);
  const ordered = factorsByUsage(data);
  const shortlist = ordered.filter((f, i) => i < SHORTLIST || on.has(f.id));

  const byKind = new Map<FactorKind, Factor[]>();
  for (const f of ordered) byKind.set(f.kind, [...(byKind.get(f.kind) ?? []), f]);

  const render = (f: Factor) => (
    <Chip
      key={f.id}
      selected={on.has(f.id)}
      onToggle={() =>
        toggle.mutate({ entry_date: date, factor_id: f.id, on: !on.has(f.id) })
      }
    >
      {f.name}
    </Chip>
  );

  return (
    <div className="flex flex-col gap-3">
      {!showAll ? (
        <div className="flex flex-wrap gap-2">
          {shortlist.map(render)}
          <Chip variant="add" selected={false} onToggle={() => setAdding(true)}>
            + Add
          </Chip>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {FACTOR_KINDS.map((kind) => {
            const list = byKind.get(kind) ?? [];
            if (list.length === 0) return null;
            return (
              <div key={kind} className="flex flex-col gap-1.5">
                <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide">
                  {FACTOR_KIND_LABELS[kind]}
                </p>
                <div className="flex flex-wrap gap-2">{list.map(render)}</div>
              </div>
            );
          })}
          <div>
            <Chip variant="add" selected={false} onToggle={() => setAdding(true)}>
              + Add your own
            </Chip>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setShowAll((v) => !v)}
        className="text-accent self-start text-sm underline-offset-2 hover:underline"
      >
        {showAll ? 'Show fewer' : `Show all (${ordered.length})`}
      </button>
      <AddFactorDialog open={adding} onClose={() => setAdding(false)} date={date} />
    </div>
  );
}

function AddFactorDialog({
  open,
  onClose,
  date
}: {
  open: boolean;
  onClose: () => void;
  date: DateKey;
}) {
  const create = useCreateFactor();
  const toggle = useToggleFactor();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<FactorKind>('food');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = newFactorSchema.safeParse({ name, kind });
    if (!parsed.success)
      return setError(parsed.error.issues[0]?.message ?? 'Check the name');
    try {
      const factor = await create.mutateAsync(parsed.data);
      toggle.mutate({ entry_date: date, factor_id: factor.id, on: true });
      setName('');
      setError(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add that factor.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent sheet>
        <DialogHeader>
          <DialogTitle>Add a factor</DialogTitle>
          <DialogDescription>
            Something you want to watch for. It will be turned on for this day.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="factor-name">Name</Label>
            <Input
              id="factor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Walnuts"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <div className="flex flex-wrap gap-2">
              {FACTOR_KINDS.map((k) => (
                <Chip key={k} selected={kind === k} onToggle={() => setKind(k)}>
                  {FACTOR_KIND_LABELS[k]}
                </Chip>
              ))}
            </div>
          </div>
          {error ? (
            <p role="alert" className="text-accent text-sm">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={create.isPending}>
              Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
