import type React from 'react';
import { useState, useRef } from 'react';
import { Stage, Layer, Group } from 'react-konva';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

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

interface ImagePointProps {
  mode: 'add' | 'edit' | 'update' | 'view';
  setMode: (mode: 'add' | 'edit' | 'update' | 'view') => void;
}

const ImagePoint: React.FC<ImagePointProps> = ({ mode, setMode }) => {
  const [sores, setSores] = useState<Sore[]>([]);
  const [selectedSore, setSelectedSore] = useState<Sore | null>(null);
  const [isGums, setIsGums] = useState(false);
  const [image, setImage] = useState('/assets/images/cat.jpeg');
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: stageWidth, height: stageHeight } = useStageSize(containerRef);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
  const [logCompleted, setLogCompleted] = useState(true);
  const navigate = useNavigate();
  const originalSores = useRef<Sore[]>([]); // Store original sores for cancellation

  useStageHandlers(stageRef, containerRef);

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

  const handleClickImage = (e: React.MouseEvent<HTMLImageElement>) => {
    const { x, y } = calculateCoordination(e);

    if (mode === 'add') {
      const newSore: Sore = {
        id: uuidv4(),
        created_at: new Date().toISOString(),
        healed: null,
        zone: calcView(x, y),
        gums: isGums,
        x,
        y,
        user_id: null
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

  const handleCancel = () => {
    setSores(originalSores.current);
    setSelectedSore(null);
    setMode('view');
    handleResetZoom(stageRef);
  };

  const handleDeleteButton = () => {
    if (selectedSore) {
      const updatedSores = sores.filter((s) => s.id !== selectedSore.id);
      setSores(updatedSores);
      setSelectedSore(null);
    } else {
      return;
    }
  };

  const handleToggleGums = () => {
    const newIsGums = !isGums;
    setIsGums(newIsGums);
    setImage(
      newIsGums ? '/assets/images/gums.png' : '/assets/images/mouth.png'
    );
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
      {logCompleted ? (
        <p>Log completed</p>
      ) : (
        <p className="text-red-500">Log not completed</p>
      )}
      <Stage
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        width={stageWidth}
        height={stageHeight}
        draggable
        onWheel={(e) => {
          if (window.innerWidth > 768) {
            handleZoomStage(stageRef)(e);
          }
        }}
        ref={stageRef}
        onTouchMove={(e) => {
          if (window.innerWidth <= 768 && e.evt.touches.length === 2) {
            handlePinchZoom(stageRef)(e);
          }
        }}
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
                mode={mode}
                handleClickLabel={handleClickLabel}
                handleDragLabelCoordination={handleDragLabelCoordination}
                stageWidth={stageWidth}
                stageHeight={stageHeight}
                selectedSoreId={selectedSore?.id || ''}
              />
            ))}
          </Group>
        </Layer>
      </Stage>
      <div className="absolute right-0 top-0 flex flex-col">
        <ImagePlotButton onClick={() => handleZoom(stageRef, 1.25)} label="+" />
        <ImagePlotButton onClick={() => handleZoom(stageRef, 0.75)} label="-" />
      </div>
      <div className="absolute bottom-0 left-0 z-10 flex w-full flex-row justify-between">
        {selectedSore && mode !== 'update' && (
          <ImagePlotButton onClick={handleDeleteButton} label="Delete" />
        )}
      </div>
      <div className="zoom-buttons absolute bottom-0 right-0 z-10 flex flex-row">
        <ImagePlotButton
          onClick={() => handleResetZoom(stageRef)}
          label="Reset"
        />
      </div>
      <div className="zoom-buttons absolute left-0 top-0 z-10 flex flex-row">
        <ImagePlotButton
          onClick={handleToggleGums}
          label={isGums ? 'Mouth' : 'Gums'}
        />
      </div>

      <div className="absolute bottom-0 left-1/2 z-20 flex -translate-x-1/2 transform flex-row justify-center gap-2">
        {mode === 'view' && (
          <>
            <ImagePlotButton
              onClick={() => {
                originalSores.current = sores;
                setSelectedSore(null);
                setMode('add');
              }}
              label="Add"
            />
            {sores.length > 0 && selectedSore && (
              <ImagePlotButton
                onClick={() => {
                  originalSores.current = sores;
                  setMode('edit');
                }}
                label="Edit"
              />
            )}
          </>
        )}
        {(mode === 'edit' || mode === 'add') && (
          <>
            <ImagePlotButton onClick={handleCancel} label="Cancel" />
            <ImagePlotButton onClick={handleCancel} label="Finish" />
          </>
        )}
        {mode === 'update' && (
          <ImagePlotButton onClick={handleCancel} label="Next" />
        )}
      </div>
    </div>
  );
};

export default ImagePoint;
