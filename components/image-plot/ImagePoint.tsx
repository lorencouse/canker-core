import type React from 'react';
import { useState, useRef } from 'react';
import { Stage, Layer, Group } from 'react-konva';
import { v4 as uuidv4 } from 'uuid';
import { Redirect } from 'next';
import SoreSliders from './SoreSliders';

import { useStageSize } from '@/utils/hooks/useStageSize';
import {
  calculateCoordination,
  handleZoomStage,
  handleZoom,
  handleResetZoom,
  handlePinchZoom
} from '@/utils/mouth-diagram/stageUtils';
import SoreCircle from './SoreCircle';

import { useStageHandlers } from '@/utils/hooks/useStateHandlers';
import type { Sore } from '@/types';
import calcView from '@/utils/calcView';

import ImagePlotButton from './ImagePlotButton';
import Images from './Images';
import { useSoreContext } from '@/context/SoreContext';
import BottomButtons from './buttons/BottomButtons';

const ImagePoint: React.FC = () => {
  const { sores, setSores, setSelectedSore, selectedSore, mode, setMode } =
    useSoreContext();
  const [isGums, setIsGums] = useState(false);
  const [image, setImage] = useState('/mouth.png');
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: stageWidth, height: stageHeight } = useStageSize(containerRef);

  // Store original sores for cancellation
  // const originalSores = useRef<Sore[]>(sores);

  useStageHandlers(stageRef, containerRef);

  const handleClickImage = (e: React.MouseEvent<HTMLImageElement>) => {
    const { x, y } = calculateCoordination(e);

    if (mode === 'add') {
      const newSore: Sore = {
        id: uuidv4(),
        sore_id: uuidv4(),
        updated: new Date().toISOString(),
        size: 3,
        pain: 3,
        x,
        y
      };

      const newSores = [...sores, newSore];
      setSores(newSores);
      setSelectedSore(newSore);
    } else if (mode === 'edit' || mode === 'view') {
      // Find the nearest sore
      const nearestSore = sores.reduce((nearest, current) => {
        const distanceToCurrent = Math.sqrt(
          (current.x - x) ** 2 + (current.y - y) ** 2
        );
        const distanceToNearest = Math.sqrt(
          (nearest.x - x) ** 2 + (nearest.y - y) ** 2
        );
        return distanceToCurrent < distanceToNearest ? current : nearest;
      }, sores[0]);

      setSelectedSore(nearestSore);
    }
  };

  const handleToggleGums = () => {
    const newIsGums = !isGums;
    setIsGums(newIsGums);
    setImage(newIsGums ? '/gums.png' : '/mouth.png');
  };

  const updateSore = (updatedSore: Sore) => {
    setSores((prevSores) =>
      prevSores.map((s) => (s.id === updatedSore.id ? updatedSore : s))
    );
  };

  return (
    <div
      ref={containerRef}
      className="border-1 border-grey relative h-full w-full rounded-2xl"
      style={{ height: '0', paddingBottom: '100%', position: 'relative' }}
    >
      <Stage
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        width={stageWidth}
        height={stageHeight}
        draggable
        onWheel={(e) => {
          handleZoomStage(stageRef)(e);
        }}
        ref={stageRef}
        onTouchMove={(e) => {
          handlePinchZoom(stageRef)(e);
        }}
      >
        <Layer>
          <Group>
            <Images
              img={image}
              handleClickImage={handleClickImage}
              // handleTouchImage={handleClickImage}
              stageWidth={stageWidth}
              stageHeight={stageHeight}
            />
            {sores.map((sore) => (
              <SoreCircle
                key={sore.id}
                sore={sore}
                stageWidth={stageWidth}
                stageHeight={stageHeight}
              />
            ))}
          </Group>
        </Layer>
      </Stage>
      <div className="absolute right-0 top-0 flex flex-col">
        <ImagePlotButton onClick={() => handleZoom(stageRef, 1.25)} label="+" />
        <ImagePlotButton onClick={() => handleZoom(stageRef, 0.75)} label="-" />
      </div>

      <div className="zoom-buttons absolute left-0 top-0 z-10 flex flex-row">
        <ImagePlotButton
          onClick={handleToggleGums}
          label={isGums ? 'Mouth' : 'Gums'}
        />
      </div>

      <BottomButtons stageRef={stageRef} />
    </div>
  );
};

export default ImagePoint;
