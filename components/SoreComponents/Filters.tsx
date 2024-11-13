import type React from 'react';
import { useState, useEffect } from 'react';

import type { CankerSore } from '../../types';

export interface FilterBy {
  zone?: string;
  active?: boolean;
  gums?: boolean;
  date?: Date;
}

interface FilterByProps {
  filterBy?: FilterBy;
  setFilterBy: (filter: FilterBy) => void;
  cankerSores: CankerSore[];
  setCankerSores: (sores: CankerSore[]) => void;
}

export const Filters: React.FC<FilterByProps> = ({
  filterBy,
  setFilterBy,
  cankerSores,
  setCankerSores,
}) => {
  const [zone, setZone] = useState<string>(filterBy?.zone || '');
  const [active, setActive] = useState<boolean>(filterBy?.active || false);
  const [gums, setGums] = useState<boolean>(filterBy?.gums || false);
  const [date, setDate] = useState<Date | undefined>(filterBy?.date);

  useEffect(() => {
    filterSores();
  }, [filterBy]);

  const filterSores = () => {
    if (filterBy) {
      let filteredSores = cankerSores;
      if (filterBy.zone) {
        filteredSores = filteredSores.filter(
          (sore) => sore.zone === filterBy.zone
        );
      }
      if (typeof filterBy.active === 'boolean') {
        filteredSores = filteredSores.filter(
          (sore) => sore.active === filterBy.active
        );
      }
      if (typeof filterBy.gums === 'boolean') {
        filteredSores = filteredSores.filter(
          (sore) => sore.gums === filterBy.gums
        );
      }
      if (filterBy.date) {
        const filterDate = new Date(filterBy.date).setHours(0, 0, 0, 0);
        filteredSores = filteredSores.filter((sore) => {
          const soreDate = new Date(
            sore.lastUpdated[sore.lastUpdated.length - 1]
          ).setHours(0, 0, 0, 0);
          return soreDate === filterDate;
        });
      }
      setCankerSores(filteredSores);
    }
  };

  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setZone(e.target.value);
    setFilterBy({ ...filterBy, zone: e.target.value });
    filterSores();
  };

  const handleActiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActive(e.target.checked);
    setFilterBy({ ...filterBy, active: e.target.checked });
    filterSores();
  };

  const handleGumsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGums(e.target.checked);
    setFilterBy({ ...filterBy, gums: e.target.checked });
    filterSores();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.valueAsDate || undefined;
    setDate(newDate);
    setFilterBy({ ...filterBy, date: newDate });
    filterSores();
  };

  return (
    <div className="sore-filters">
      <div>
        <strong>Filter Sores By:</strong>
      </div>
      <div>
        <label>
          Active:
          <input
            type="checkbox"
            checked={active}
            onChange={handleActiveChange}
          />
        </label>
      </div>
      <div>
        <label>
          Gums:
          <input type="checkbox" checked={gums} onChange={handleGumsChange} />
        </label>
      </div>

      {/* <ZoneSelector onChange={handleZoneChange} zone={zone}/> */}

      <div>
        <label>
          Date:
          <input
            type="date"
            value={date ? date.toISOString().split('T')[0] : ''}
            onChange={handleDateChange}
          />
        </label>
      </div>
    </div>
  );
};
