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

import { useStageHandlers } from '@/utils/hooks/useStageHandlers';
import type { Sore, User } from '@/types';
import calcView from '@/utils/calcView';

import ImagePlotButton from './ImagePlotButton';
import Images from './Images';
import { useSoreContext } from '@/context/SoreContext';
import BottomButtons from './buttons/BottomButtons';

interface ImagePointProps {
  user: User;
}

const ImagePoint: React.FC<ImagePointProps> = ({ user }) => {
  const { sores, setSores, setSelectedSore, selectedSore, mode, setMode } =
    useSoreContext();
  const [isGums, setIsGums] = useState(false);
  const [image, setImage] = useState('/images/diagram/mouth.png');
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: stageWidth, height: stageHeight } = useStageSize(containerRef);

  useStageHandlers(stageRef, containerRef);

  const handleClickImage = (e: React.MouseEvent<HTMLImageElement>) => {
    const { x, y } = calculateCoordination(e);

    if (mode === 'add') {
      const newSore: Sore = {
        id: uuidv4(),
        user_id: user.id || '',
        healed: null,
        dates: [new Date().toISOString()],
        size: [3],
        pain: [3],
        x,
        y,
        gums: isGums,
        zone: calcView(x, y)
      };

      const newSores = [...sores, newSore];
      setSores(newSores);
      setSelectedSore(newSore);
    } else {
      // Handle empty sores array
      if (sores.length === 0) {
        setSelectedSore(null);
        return;
      }

      // Find the nearest sore using a threshold distance
      const CLICK_THRESHOLD = 5;
      let nearestSore = null;
      let shortestDistance = Infinity;

      sores.forEach((sore) => {
        if (
          sore.x === undefined ||
          sore.y === undefined ||
          sore.x === null ||
          sore.y === null
        )
          return;

        const distance = Math.sqrt(
          Math.pow(sore.x - x, 2) + Math.pow(sore.y - y, 2)
        );

        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestSore = sore;
        }
      });

      // Only select the sore if it's within the threshold distance
      if (nearestSore && shortestDistance <= CLICK_THRESHOLD) {
        setSelectedSore(nearestSore);
      } else {
        setSelectedSore(null);
      }
    }
  };

  const setGumsMode = (gums: boolean) => {
    setIsGums(gums);
    setImage(gums ? '/images/diagram/gums.png' : '/images/diagram/mouth.png');
  };

  const handleToggleGums = () => {
    const newIsGums = !isGums;
    setGumsMode(newIsGums);
    if (selectedSore) {
      setSelectedSore({ ...selectedSore, gums: newIsGums });
    }
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
        onTouchMove={handlePinchZoom(stageRef)}
        ref={stageRef}
      >
        <Layer>
          <Group>
            <Images
              img={image}
              handleClickImage={handleClickImage}
              stageWidth={stageWidth}
              stageHeight={stageHeight}
            />
            {sores.map((sore) => (
              <SoreCircle
                key={sore.id}
                sore={sore}
                stageWidth={stageWidth}
                stageHeight={stageHeight}
                setGumsMode={setGumsMode}
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
