import React, { useState } from 'react';
import { useSoreContext } from '@/context/SoreContext';
import { handleResetZoom } from '@/utils/mouth-diagram/stageUtils';
import ImagePlotButton from '../ImagePlotButton';
import { Sore } from '@/types';
import { upsertSores, deleteSore } from '@/app/actions/soreActions';

const BottomButtons = ({ stageRef }: { stageRef: any }) => {
  const { sores, setSores, setSelectedSore, selectedSore, setMode, mode } =
    useSoreContext();
  const [originalSores, setOriginalSores] = useState<Sore[]>(sores);

  const handleFinish = async () => {
    await upsertSores(sores);
    setMode('view');
    setSelectedSore(null);
  };

  const handleCancel = () => {
    setSores(originalSores);
    setSelectedSore(null);
    setMode('view');
    handleResetZoom(stageRef);
  };

  const handleDeleteButton = async () => {
    if (selectedSore) {
      await deleteSore(selectedSore.id);
      const updatedSores = sores.filter((s) => s.id !== selectedSore.id);
      setSores(updatedSores);
      setSelectedSore(null);
    } else {
      return;
    }
  };

  return (
    <>
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
      <div className="absolute bottom-0 left-1/2 z-20 flex -translate-x-1/2 transform flex-row justify-center gap-2">
        {mode === 'view' && (
          <>
            <ImagePlotButton
              onClick={() => {
                //   originalSores.current = sores;
                setSelectedSore(null);
                setOriginalSores(sores);
                setMode('add');
              }}
              label="Add"
            />
            {sores.length > 0 && selectedSore && (
              <ImagePlotButton
                onClick={() => {
                  // originalSores.current = sores;
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
            <ImagePlotButton onClick={handleFinish} label="Finish" />
          </>
        )}
        {mode === 'update' && (
          <ImagePlotButton onClick={handleCancel} label="Next" />
        )}
      </div>
    </>
  );
};

export default BottomButtons;
