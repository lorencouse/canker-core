import { Sore } from '@/types';
import type React from 'react';
import { Circle, Group } from 'react-konva';
import { useSoreContext } from '@/context/SoreContext';
import { calculateCoordination } from '@/utils/mouth-diagram/stageUtils';

interface SoreCircleProps {
  sore: Sore;
  stageWidth: number;
  stageHeight: number;
}

const SoreCircle: React.FC<SoreCircleProps> = ({
  sore,
  stageWidth,
  stageHeight
}) => {
  const { sores, setSores, setSelectedSore, selectedSore, mode } =
    useSoreContext();

  const getColor = (painLevel: number) => {
    const lightness = 100 - painLevel * 7;
    return `hsl(0, 100%, ${lightness}%)`;
  };

  const latestSize = sore.size ? sore.size : 3;
  const latestPain = sore.pain ? sore.pain : 3;

  const handleDragLabelCoordination = (e: any) => {
    if (mode === 'add' || mode === 'edit' || mode === 'update') {
      const { x, y } = calculateCoordination(e);
      const target = e.target as any;
      const id = target.id() || target.findAncestor('Group')?.attrs.id;
      const updatedSores: Sore[] = sores.map((sore) =>
        sore.id === id ? { ...sore, x, y } : sore
      );

      setSores(updatedSores);
      const updatedSore = updatedSores.find((sore) => sore.id === id);
      setSelectedSore(updatedSore || null);
    }
  };

  const handleClickLabel = (e: any) => {
    const id = e.target.id() || e.target.findAncestor('Group')?.attrs.id;
    setSelectedSore(sores.find((sore) => sore.id === id) || null);
  };

  return (
    <Group
      id={`${sore.id}`}
      x={(sore.x * stageWidth) / 100}
      y={(sore.y * stageHeight) / 100}
      draggable={mode !== 'view'}
      onDragEnd={handleDragLabelCoordination}
      onClick={handleClickLabel}
    >
      <Circle
        radius={latestSize}
        fill={getColor(latestPain)}
        shadowBlur={sore.id === selectedSore?.id ? 10 : 0}
        shadowColor="white"
        stroke={sore.id === selectedSore?.id ? 'white' : 'black'}
        strokeWidth={sore.id === selectedSore?.id ? 2 : 1}
      />
    </Group>
  );
};

export default SoreCircle;
