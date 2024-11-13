import type React from 'react';
import { useEffect, useState } from 'react';

import { useUIContext } from '@/Context/UiContext';

function ListItem({ label, data }: { label: string; data: string | number }) {
  return (
    <li className="mb-2 text-left">
      <span className="item-label font-bold">{label}</span> {data}
    </li>
  );
}

const SoreDetails: React.FC = () => {
  const { selectedSore, setSelectedSore, sores } = useUIContext();
  const [soreIndex, setSoreIndex] = useState(0);
  const getColor = (painLevel: number) => {
    const lightness = 100 - painLevel * 7;
    return `hsl(0, 100%, ${lightness}%)`;
  };

  useEffect(() => {
    const currentIndex = sores.findIndex(
      (sore) => sore.id === selectedSore?.id
    );
    setSoreIndex(currentIndex);
  }, [selectedSore, sores]);

  const handlePreviousSoreClick = () => {
    if (soreIndex > 0) {
      setSelectedSore(sores[soreIndex - 1]);
    } else {
      setSelectedSore(sores[sores.length - 1]);
    }
  };

  const handleNextSoreClick = () => {
    if (soreIndex < sores.length - 1) {
      setSelectedSore(sores[soreIndex + 1]);
    } else {
      setSelectedSore(sores[0]);
    }
  };

  return (
    <div className="sore-details">
      {selectedSore && (
        <div className="sore-details-container border-grey my-4 w-full rounded-lg border-2 border-solid">
          <div
            className="sore-details-header flex flex-row justify-between rounded-t-lg bg-background text-foreground"
            onClick={handlePreviousSoreClick}
          >
            <div className="previous-sore cursor-pointer rounded-tl-lg border-r-2 border-gray-200 p-6 hover:bg-muted">
              <span> {'<'} </span>
            </div>
            <h3 className="border-grey m-5 text-2xl font-bold">
              Sore {soreIndex + 1}
            </h3>
            <div
              className="next-sore border-l-2 border-gray-200 p-6"
              onClick={handleNextSoreClick}
            >
              <span> {'>'} </span>
            </div>
          </div>
          <hr />
          <div className="flex flex-row">
            <ul className="m-5 w-3/4">
              <ListItem
                label="Began: "
                data={new Date(selectedSore.updated[0]).toLocaleDateString()}
              />
              {selectedSore.updated.length > 1 && (
                <ListItem
                  label="Last Updated: "
                  data={selectedSore.updated
                    .map((date) => new Date(date).toLocaleDateString())
                    .join(', ')}
                />
              )}
              <ListItem
                label="Location: "
                data={`${selectedSore.zone} ${selectedSore.gums ? 'on Gums' : ''}`}
              />
              <ListItem
                label="Sore Size: "
                data={selectedSore.size.join(', ')}
              />
              <ListItem
                label="Pain Level: "
                data={selectedSore.pain.join(', ')}
              />
              <ListItem
                label="X: "
                data={selectedSore.x.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              />
              <ListItem
                label="Y: "
                data={selectedSore.y.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              />
            </ul>
            <div className="flex flex-grow flex-col items-center justify-center p-5">
              <div
                className="sore-preview"
                style={{
                  width: selectedSore.size[selectedSore.size.length - 1] * 2,
                  height: selectedSore.size[selectedSore.size.length - 1] * 2,
                  backgroundColor: getColor(
                    selectedSore.pain[selectedSore.pain.length - 1]
                  ),
                  borderRadius: '50%',
                  boxShadow: '0 0 10px foreground',
                  border: '2px solid foreground',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { SoreDetails, ListItem };
