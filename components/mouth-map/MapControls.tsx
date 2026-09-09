import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useSoreContext } from '@/context/SoreContext';
import type { Sore } from '@/types';
import { deleteSore, upsertSores } from '@/utils/actions/soreActions';

/** A control floating over the map, translucent so the drawing shows through. */
function MapButton({
  onClick, label, variant = 'overlay', ...rest
}: {
  onClick: () => void;
  label: string;
  variant?: 'overlay' | 'default' | 'destructive';
  'aria-label'?: string;
}) {
  return (
    <Button type="button" onClick={onClick} variant={variant} size="xs" {...rest}>
      {label}
    </Button>
  );
}

/**
 * The mode buttons along the bottom edge of the map. Add and Edit are
 * two-step: they open an editing session that Finish commits and Cancel
 * rolls back to the sores as they were.
 */
function MapControls({ onReset }: { onReset: () => void }) {
  const { sores, setSores, setSelectedSore, selectedSore, setMode, mode } = useSoreContext();
  const [snapshot, setSnapshot] = useState<Sore[]>(sores);

  const begin = (next: 'add' | 'edit') => {
    setSnapshot(sores);
    if (next === 'add') setSelectedSore(null);
    setMode(next);
  };

  const finish = async () => {
    await upsertSores(sores);
    setMode('view');
    setSelectedSore(null);
  };

  const cancel = () => {
    setSores(snapshot);
    setSelectedSore(null);
    setMode('view');
    onReset();
  };

  const remove = async () => {
    if (!selectedSore) return;
    await deleteSore(selectedSore.id);
    setSores(sores.filter((s) => s.id !== selectedSore.id));
    setSelectedSore(null);
  };

  return (
    <>
      {selectedSore && mode !== 'update' && (
        <div className="absolute bottom-3 left-3">
          <MapButton onClick={remove} label="Delete" />
        </div>
      )}
      <div className="absolute bottom-3 right-3">
        <MapButton onClick={onReset} label="Reset" aria-label="Reset zoom" />
      </div>
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        {mode === 'view' && (
          <>
            <MapButton onClick={() => begin('add')} label="Add" variant="default" />
            {selectedSore && <MapButton onClick={() => begin('edit')} label="Edit" />}
          </>
        )}
        {(mode === 'add' || mode === 'edit') && (
          <>
            <MapButton onClick={cancel} label="Cancel" />
            <MapButton onClick={finish} label="Finish" variant="default" />
          </>
        )}
        {mode === 'update' && <MapButton onClick={cancel} label="Next" />}
      </div>
    </>
  );
}

MapControls.Button = MapButton;
export default MapControls;
