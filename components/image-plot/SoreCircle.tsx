import { Sore } from '@/types';
import type React from 'react';
import { Circle, Group } from 'react-konva';
import { useSoreContext } from '@/context/SoreContext';
import { calculateCoordination } from '@/utils/mouth-diagram/stageUtils';
import calcView from '@/utils/calcView';
import { getColor } from '@/utils/getColor';
interface SoreCircleProps {
  sore: Sore;
  stageWidth: number;
  stageHeight: number;
  setGumsMode: (isGums: boolean) => void;
}

const SoreCircle: React.FC<SoreCircleProps> = ({
  sore,
  stageWidth,
  stageHeight,
  setGumsMode
}) => {
  const { sores, setSores, setSelectedSore, selectedSore, mode } =
    useSoreContext();

  const latestSize = sore?.size ? sore.size[sore.size.length - 1] : 3;
  const latestPain = sore?.pain ? sore.pain[sore.pain.length - 1] : 3;

  const handleDragLabelCoordination = (e: any) => {
    if (mode === 'add' || mode === 'edit' || mode === 'update') {
      const { x, y } = calculateCoordination(e);
      const target = e.target as any;
      const id = target.id() || target.findAncestor('Group')?.attrs.id;
      const updatedSores: Sore[] = sores.map((sore) =>
        sore.id === id ? { ...sore, x, y, zone: calcView(x, y) } : sore
      );

      setSores(updatedSores);
      const updatedSore = updatedSores.find((sore) => sore.id === id);
      setSelectedSore(updatedSore || null);
    }
  };

  const handleClickLabel = (e: any) => {
    const id = e.target.id() || e.target.findAncestor('Group')?.attrs.id;
    const currentSore = sores.find((sore) => sore.id === id) || null;
    setSelectedSore(sores.find((sore) => sore.id === id) || null);
    setGumsMode(currentSore?.gums || false);
  };

  return (
    <Group
      id={`${sore.id}`}
      x={((sore.x ? sore.x : 0) * stageWidth) / 100}
      y={((sore.y ? sore.y : 0) * stageHeight) / 100}
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
