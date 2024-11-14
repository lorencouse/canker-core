import { Sore } from '@/types';
import type React from 'react';
import { Circle, Group } from 'react-konva';

// import { useUIContext } from '@/Context/UiContext';

interface SoreCircleProps {
  sore: Sore;
  mode: 'add' | 'edit' | 'update' | 'view';
  handleDragLabelCoordination: (e: any) => void;
  handleClickLabel: (e: any) => void;
  stageWidth: number;
  stageHeight: number;
  selectedSoreId: string;
}

const SoreCircle: React.FC<SoreCircleProps> = ({
  sore,
  
  mode,
  handleDragLabelCoordination,
  handleClickLabel,
  stageWidth,
  stageHeight,
  selectedSoreId
}) => {
  const getColor = (painLevel: number) => {
    const lightness = 100 - painLevel * 7;
    return `hsl(0, 100%, ${lightness}%)`;
  };

  // const latestSize = sore.size[sore.size.length - 1];
  // const latestPain = sore.pain[sore.pain.length - 1];
  const latestSize = 5;
  const latestPain = 5;

  const selectedSore: Sore | null = null;

  return (
    <Group
      id={`${sore.id}`}
      x={(sore.x * stageWidth) / 100}
      y={(sore.y * stageHeight) / 100}
      draggable={mode === 'add' || mode === 'edit'}
      onDragEnd={handleDragLabelCoordination}
      onClick={handleClickLabel}
    >
      <Circle
        radius={latestSize}
        fill={getColor(latestPain)}
        shadowBlur={sore.id === selectedSoreId ? 10 : 0}
        shadowColor="white"
        stroke={sore.id === selectedSoreId ? 'white' : 'black'}
        strokeWidth={sore.id === selectedSoreId ? 2 : 1}
      />
    </Group>
  );
};

export default SoreCircle;
