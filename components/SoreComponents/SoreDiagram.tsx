import type React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';

import { useUIContext } from '../../Context/UiContext';
import { useSoreManager } from '../../hooks/useSoreManager';
import {
  handleAddSoreClick,
  handleFindNearestSoreClick,
} from '../../utilities/ClickHandlers';
// import gumsDiagramImage from '../../assets/images/GumsDiagram.png';
// import mouthDiagramImage from '../../assets/images/mouthDiagramNoLabels.png';
import { Button } from '../Button';

import SoreCircle from './SoreCircle';

function SoreDiagram() {
  const imageRef = useRef<HTMLImageElement>(null);
  const [zoomed, setZoomed] = useState<number>(1);
  const [offset, setOffset] = useState<[number, number]>([0, 0]);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [toggleGums, setToggleGums] = useState(false);
  const imageURL = toggleGums
    ? '/assets/images/GumsDiagram.png'
    : '/assets/images/mouthDiagramNoLabels.png';
  const buttonLabel = toggleGums ? 'Switch to Mouth' : 'Switch to Gums';
  const {
    mode,
    cankerSores,
    selectedSore,
    setSelectedSore,
    dailyLogCompleted,
    setSoresToUpdate,
    soresToUpdate,
    setMode,
  } = useUIContext();
  const { fetchSores } = useSoreManager();

  const handleImageClick = (
    event: React.MouseEvent<HTMLImageElement, MouseEvent>
  ) => {
    if (mode === 'add') {
      handleAddSoreClick(
        event,
        toggleGums,
        setSelectedSore,
        setZoomed,
        zoomed,
        zoomToSore
      );
    } else {
      handleFindNearestSoreClick(event, cankerSores, setSelectedSore, imageRef);
    }
  };

  const zoomToSore = useCallback(
    (x: number, y: number) => {
      const xPercent = x * 100;
      const yPercent = y * 100;
      const newOffsetX = (xPercent - 50) * -zoomed;
      const newOffsetY = (yPercent - 50) * -zoomed;
      setOffset([newOffsetX, newOffsetY]);
    },
    [zoomed]
  );

  const handleZoomOut = useCallback(() => {
    setZoomed(1);
    setOffset([0, 0]);
  }, []);

  const handleGumsMode = useCallback(() => {
    const newGumsVal = !toggleGums;
    setToggleGums(newGumsVal);

    if (selectedSore !== null) {
      const updatedSore = { ...selectedSore, gums: newGumsVal };
      setSelectedSore(updatedSore);
    }
  }, [selectedSore, toggleGums, setSelectedSore]);

  useEffect(() => {
    if (mode === 'edit' || mode === 'update') {
      if (selectedSore) {
        setToggleGums(selectedSore.gums);
        setZoomed(2);
        zoomToSore(
          selectedSore.xCoordinate || 0,
          selectedSore.yCoordinate || 0
        );
      }
    } else if (mode === 'view') {
      setZoomed(1);
      setToggleGums(false);
      zoomToSore(0, 0);
    }
  }, [mode, selectedSore, zoomToSore]);

  useEffect(() => {
    fetchSores();

    if (!dailyLogCompleted && cankerSores.length > 0) {
      setSoresToUpdate(cankerSores.length - 1);
      setSelectedSore(cankerSores[soresToUpdate]);
      setMode('view');
    }
  }, []);

  const updateImageSize = useCallback(() => {
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.offsetWidth,
        height: imageRef.current.offsetHeight,
      });
    }
  }, []);

  return (
    <div className="existing-sores-diagram">
      <div className="mouth-image-container border-1 rounded-3xl border">
        <img
          ref={imageRef}
          src={imageURL}
          alt="Mouth Diagram"
          onLoad={updateImageSize}
          onClick={handleImageClick}
          className="mouth-image cursor-pointer transition duration-1000 ease-in-out"
          style={{
            transform: `scale(${zoomed})`,
            transformOrigin: `${50 - offset[0]}% ${50 - offset[1]}%`,
          }}
        />
        {selectedSore && (
          <SoreCircle
            sore={selectedSore}
            imageDimensions={imageDimensions}
            selected
            zoomed={zoomed}
            offsetX={offset[0]}
            offsetY={offset[1]}
            setSelectedSore={setSelectedSore}
          />
        )}
        {cankerSores
          .filter((sore) => sore.id !== selectedSore?.id)
          .map((sore) => (
            <SoreCircle
              key={sore.id}
              sore={sore}
              imageDimensions={imageDimensions}
              selected={sore.id === selectedSore?.id}
              zoomed={zoomed}
              offsetX={offset[0]}
              offsetY={offset[1]}
              setSelectedSore={setSelectedSore}
            />
          ))}
      </div>
      {mode !== 'view' && (
        <Button label={buttonLabel} action={handleGumsMode} />
      )}
      {zoomed > 1 && <Button label="Zoom Out" action={() => setZoomed(1)} />}
    </div>
  );
}

export default SoreDiagram;
