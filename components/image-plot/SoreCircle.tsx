import { Sore } from '@/types';
import type React from 'react';
import { Circle, Group } from 'react-konva';
import { useSoreContext } from '@/context/SoreContext';
import { calculateCoordination } from '@/utils/mouth-diagram/stageUtils';
import calcView from '@/utils/calcView';
import { getSeverityColor } from '@/utils/getColor';
import { useIsDark } from '@/utils/hooks/useIsDark';
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
  const isDark = useIsDark();
  const isSelected = sore.id === selectedSore?.id;

  const latestSize = sore?.size ? sore.size[sore.size.length - 1] : 3;
  const latestPain = sore?.pain ? sore.pain[sore.pain.length - 1] : 3;

  /*
   * Sizes are recorded in millimetres, so they have to be scaled to the stage
   * rather than used as raw pixels - at 1px per mm a 2mm sore is invisible.
   * The mouth opening spans roughly 55% of the diagram and is about 50mm
   * across, which gives the mm-per-pixel factor below. Radius is half the
   * recorded width, and every sore keeps a floor so it stays tappable.
   */
  const pixelsPerMm = (stageWidth * 0.55) / 50;
  const radius = Math.max(4, (latestSize / 2) * pixelsPerMm);

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
      onTap={handleClickLabel}
    >
      <Circle
        radius={radius}
        fill={getSeverityColor(latestPain, isDark)}
        stroke={
          isSelected
            ? isDark
              ? '#ffffff'
              : '#1c2733'
            : isDark
              ? 'rgba(255,255,255,0.45)'
              : 'rgba(28,39,51,0.45)'
        }
        strokeWidth={isSelected ? 2 : 1}
        {...(isSelected
          ? {
              shadowBlur: 12,
              shadowColor: isDark ? '#ffffff' : '#000000',
              shadowOpacity: 0.5
            }
          : {})}
      />
    </Group>
  );
};

export default SoreCircle;
