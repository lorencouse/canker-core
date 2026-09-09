import type React from 'react';
import { useEffect, useState } from 'react';

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useSoreContext } from '@/context/SoreContext';

const SoreSliders: React.FC = () => {
  const { selectedSore, setSelectedSore, sores, setSores } = useSoreContext();

  const initialSoreSize = selectedSore?.size
    ? selectedSore.size[selectedSore.size.length - 1]
    : 3;
  const initialPainLevel = selectedSore?.pain
    ? selectedSore.pain[selectedSore.pain.length - 1]
    : 3;

  const [soreSize, setSoreSize] = useState<number>(initialSoreSize);
  const [painLevel, setPainLevel] = useState<number>(initialPainLevel);

  /** Replace the current reading in place; earlier readings are history. */
  const commit = (field: 'size' | 'pain', newValue: number) => {
    if (!selectedSore) return;
    const series = selectedSore[field];
    const updatedSore = {
      ...selectedSore,
      [field]: series ? [...series.slice(0, -1), newValue] : [newValue]
    };
    setSelectedSore(updatedSore);
    setSores(
      sores.map((sore) => (sore.id === selectedSore.id ? updatedSore : sore))
    );
  };

  const handleSizeChange = (newValue: number) => {
    setSoreSize(newValue);
    commit('size', newValue);
  };

  const handlePainChange = (newValue: number) => {
    setPainLevel(newValue);
    commit('pain', newValue);
  };

  useEffect(() => {
    if (selectedSore) {
      setSoreSize(
        selectedSore.size?.length
          ? selectedSore.size[selectedSore.size.length - 1]
          : 3
      );
      setPainLevel(
        selectedSore.pain?.length
          ? selectedSore.pain[selectedSore.pain.length - 1]
          : 3
      );
    }
  }, [selectedSore]);

  if (!selectedSore) return null;

  return (
    <div className="space-y-5 rounded-lg border border-border bg-card p-5">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="sore-size">How wide is it?</Label>
          <span className="tabular text-sm font-medium">{soreSize} mm</span>
        </div>
        <Slider
          id="sore-size"
          min={1}
          max={20}
          value={[soreSize]}
          onValueChange={(values) => handleSizeChange(values[0])}
          aria-label="Sore size in millimetres"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="sore-pain">How much does it hurt?</Label>
          <span className="tabular text-sm font-medium">{painLevel} of 10</span>
        </div>
        <Slider
          id="sore-pain"
          tone="severity"
          min={1}
          max={10}
          value={[painLevel]}
          onValueChange={(values) => handlePainChange(values[0])}
          aria-label="Pain level from 1 to 10"
        />
      </div>
    </div>
  );
};

export default SoreSliders;
