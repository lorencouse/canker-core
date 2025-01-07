import type React from 'react';
import { useState, useEffect } from 'react';

import { Slider } from '@/components/ui/slider';
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

  const handleSizeChange = (newValue: number) => {
    setSoreSize(newValue);

    if (selectedSore) {
      const updatedSore = {
        ...selectedSore,
        size: [...(selectedSore.size ?? []), newValue]
      };
      setSelectedSore(updatedSore);

      // Update the sores array
      const updatedSores = sores.map((sore) =>
        sore.id === selectedSore.id ? updatedSore : sore
      );
      setSores(updatedSores);
    }
  };

  const handlePainChange = (newValue: number) => {
    setPainLevel(newValue);

    if (selectedSore) {
      const updatedSore = {
        ...selectedSore,
        pain: [...(selectedSore.pain ?? []), newValue]
      };
      setSelectedSore(updatedSore);

      // Update the sores array
      const updatedSores = sores.map((sore) =>
        sore.id === selectedSore.id ? updatedSore : sore
      );
      setSores(updatedSores);
    }
  };

  useEffect(() => {
    if (selectedSore) {
      const lastSize = selectedSore.size?.length
        ? selectedSore.size[selectedSore.size.length - 1]
        : 3;
      const lastPain = selectedSore.pain?.length
        ? selectedSore.pain[selectedSore.pain.length - 1]
        : 3;
      setSoreSize(lastSize);
      setPainLevel(lastPain);
    }
  }, [selectedSore]);

  return (
    <div>
      {selectedSore && (
        <div className="sliders text-left text-xl">
          <div className="slider-container">
            <p className="my-4">
              <span className="font-bold">Size:</span> {soreSize}
            </p>
            <Slider
              min={1}
              max={20}
              value={[soreSize]}
              onValueChange={(values) => handleSizeChange(values[0])}
            />
          </div>
          <div className="slider-container my-10">
            <p className="my-4">
              <span className="font-bold">Pain:</span> {painLevel}
            </p>
            <Slider
              min={1}
              max={10}
              value={[painLevel]}
              onValueChange={(values) => handlePainChange(values[0])}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SoreSliders;
