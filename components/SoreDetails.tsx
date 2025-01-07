import type React from 'react';
import { useEffect, useState } from 'react';

import { useSoreContext } from '@/context/SoreContext';
import SoreSliders from './image-plot/SoreSliders';

function ListItem({ label, data }: { label: string; data: string | number }) {
  return (
    <li className="mb-2 text-left">
      <span className="item-label font-bold">{label}</span> {data}
    </li>
  );
}

const SoreDetails: React.FC = () => {
  const { selectedSore, setSelectedSore, sores, mode } = useSoreContext();
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
    <>
      {mode !== 'view' && <SoreSliders />}

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
                  label="Last Updated: "
                  data={
                    selectedSore.dates
                      ? selectedSore.dates[selectedSore.dates?.length - 1]
                      : 'N/A'
                  }
                />

                <ListItem
                  label="Sore Size: "
                  data={
                    selectedSore.size
                      ? selectedSore.size[
                          selectedSore.size.length - 1
                        ]?.toString()
                      : 'N/A'
                  }
                />
                <ListItem
                  label="Pain Level: "
                  data={
                    selectedSore.pain
                      ? selectedSore.pain[
                          selectedSore.pain.length - 1
                        ]?.toString()
                      : 'N/A'
                  }
                />
                <ListItem
                  label="X: "
                  data={selectedSore.x ? Math.round(selectedSore.x) : 0}
                />
                <ListItem
                  label="Y: "
                  data={selectedSore.y ? Math.round(selectedSore.y) : 0}
                />
                <ListItem
                  label="On: "
                  data={selectedSore.gums ? 'Gums' : 'Mouth'}
                />
                <ListItem label="Zone: " data={selectedSore.zone} />
                <ListItem label="User ID: " data={selectedSore.user_id} />
              </ul>
              <div className="flex flex-grow flex-col items-center justify-center p-5">
                <div
                  className="sore-preview"
                  style={{
                    width:
                      (selectedSore.size
                        ? selectedSore.size[selectedSore.size?.length - 1]
                        : 0) * 2,
                    height:
                      (selectedSore.size
                        ? selectedSore.size[selectedSore.size?.length - 1]
                        : 0) * 2,
                    backgroundColor: getColor(
                      selectedSore.pain
                        ? selectedSore.pain[selectedSore.pain?.length - 1]
                        : 0
                    ),
                    borderRadius: '50%',
                    boxShadow: '0 0 10px foreground',
                    border: '2px solid foreground'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export { SoreDetails, ListItem };
