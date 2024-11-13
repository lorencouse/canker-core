import type React from 'react';
import { Circle, Group } from 'react-konva';

const SoreCircle: React.FC<SoreCircleProps> = ({
  sore,
  mode,
  handleDragLabelCoordination,
  handleClickLabel,
  stageWidth,
  stageHeight
}) => {
  const getColor = (painLevel: number) => {
    const lightness = 100 - painLevel * 7;
    return `hsl(0, 100%, ${lightness}%)`;
  };

  const latestSize = sore.size[sore.size.length - 1];
  const latestPain = sore.pain[sore.pain.length - 1];

  // const { selectedSore } = useUIContext();

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
        shadowBlur={sore.id === selectedSore?.id ? 10 : 0}
        shadowColor="white"
        // stroke={sore.id === selectedSore?.id ? 'white' : 'black'}
        // strokeWidth={sore.id === selectedSore?.id ? 2 : 1}
        stroke="black"
        strokeWidth={1}
      />
    </Group>
  );
};

export default SoreCircle;
