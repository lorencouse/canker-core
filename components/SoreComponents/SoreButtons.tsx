import { useNavigate } from 'react-router-dom';

import { useUIContext } from '../../Context/UiContext';
import { useSoreManager } from '../../hooks/useSoreManager';
import { saveData } from '../../services/firestoreService';
import { Button } from '../Button';

export default function SoreButtons() {
  const {
    fetchSores,
    addSore,
    updateSore,
    updateSoreNewDay,
    removeSore,
    removeAllSores,
  } = useSoreManager();
  const {
    mode,
    setMode,
    dailyLogCompleted,
    setIsDialogOpen,
    soresToUpdate,
    setSoresToUpdate,
    cankerSores,
    selectedSore,
    setSelectedSore,
  } = useUIContext();
  const navigate = useNavigate();

  // Button Handlers
  function addButtonHandler() {
    setSelectedSore(null);
    setMode('add');
  }

  async function addMoreButtonHandler() {
    if (selectedSore) {
      try {
        addSore(selectedSore);
        // setSelectedSore(null);
      } catch (error) {
        console.error('Failed to save sore and navigate:', error);
      }
    } else {
      alert('Please click image to select sore location.');
    }
  }

  const editButtonHandler = () => {
    if (selectedSore) {
      setMode('edit');
    } else {
      alert('Please select a sore to edit.');
    }
  };

  function finishEditingButtonHandler() {
    if (selectedSore) {
      try {
        updateSore(selectedSore);
        setMode('view');
        setSelectedSore(null);
      } catch (error) {
        console.error('Failed to update:', error);
      }
    } else {
      setMode('view');
    }
  }

  async function updateButtonHandler() {
    if (selectedSore && mode === 'update' && soresToUpdate > 0) {
      try {
        if (
          selectedSore.soreSize.length > 0 &&
          selectedSore.soreSize[selectedSore.soreSize.length - 1] === 0
        ) {
          await saveData('healedCankerSores', selectedSore.id, selectedSore);
          removeSore();
        } else {
          updateSoreNewDay();
        }
      } catch (error) {
        console.error('Failed to update:', error);
        return;
      }
      setSoresToUpdate((soresToUpdate) => soresToUpdate - 1);
      setSelectedSore(cankerSores[soresToUpdate]);
    } else {
      setMode('view');
      setIsDialogOpen(true);
    }
  }

  async function finishAddingButtonHandler() {
    if (selectedSore) {
      try {
        await addSore(selectedSore);
        setSelectedSore(null);
        setMode('view');
        if (!dailyLogCompleted) {
          navigate('/daily-log');
        } else {
          fetchSores();
        }
      } catch (error) {
        console.error('Failed to finish adding:', error);
      }
    } else {
      setMode('view');
    }
  }

  async function deletedAllButtonHandler() {
    if (window.confirm('Are you sure you want to delete all cankersores?')) {
      removeAllSores();
      setSelectedSore(null);
    }
  }

  return (
    <div>
      <h3>
        {mode === 'add' && !selectedSore
          ? 'Select a Location'
          : mode === 'add' && selectedSore
            ? `Sore on ${selectedSore.zone}${selectedSore.gums ? ' Gums' : ''}`
            : mode === 'edit'
              ? `Edit Mode${`: ${selectedSore?.zone ?? ''}`}`
              : 'Tap Image to Select a Sore'}
      </h3>

      <div className="flex flex-row">
        {mode === 'add' && (
          <>
            {selectedSore && (
              <Button label="Add More" action={addMoreButtonHandler} />
            )}
            <Button
              label={selectedSore ? 'Finish' : 'Go Back'}
              action={finishAddingButtonHandler}
            />
            <Button
              label="Cancel"
              action={() => {
                setMode('view');
                setSelectedSore(null);
              }}
            />
          </>
        )}

        {mode === 'view' && !selectedSore && (
          <>
            <Button label="Add New" action={addButtonHandler} />
            <Button label="Delete all" action={deletedAllButtonHandler} />{' '}
          </>
        )}

        {mode === 'view' && selectedSore && (
          <>
            <Button label="Add New" action={addButtonHandler} />
            <Button label="Edit" action={editButtonHandler} />
            <Button label="Delete" action={removeSore} />
            <Button label="Delete all" action={deletedAllButtonHandler} />
          </>
        )}

        {!dailyLogCompleted && mode === 'edit' && (
          <Button label="Update" action={updateButtonHandler} />
        )}

        {mode === 'edit' && (
          <>
            <Button label="Finish" action={finishEditingButtonHandler} />
            <Button label="Delete" action={removeSore} />
          </>
        )}
      </div>
    </div>
  );
}
