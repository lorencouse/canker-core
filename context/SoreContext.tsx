import type { ReactNode } from 'react';
import type React from 'react';
import { createContext, useContext, useState, useMemo } from 'react';

import { Sore } from '@/types';

interface SoreContextProps {
  sores: Sore[];
  setSores: React.Dispatch<React.SetStateAction<Sore[]>>;
  selectedSore: Sore | null;
  setSelectedSore: React.Dispatch<React.SetStateAction<Sore | null>>;
}

interface SoreProviderProps {
  children: ReactNode;
}

const SoreContext = createContext<SoreContextProps | undefined>(undefined);

export const SoreProvider: React.FC<SoreProviderProps> = ({ children }) => {
  const [sores, setSores] = useState<Sore[]>([]);
  const [selectedSore, setSelectedSore] = useState<Sore | null>(null);

  const contextValue = useMemo(
    () => ({
      sores,
      setSores,
      selectedSore,
      setSelectedSore
    }),
    [sores, selectedSore]
  );

  return (
    <SoreContext.Provider value={contextValue}>{children}</SoreContext.Provider>
  );
};

export const useSoreContext = (): SoreContextProps => {
  const context = useContext(SoreContext);
  if (!context) {
    throw new Error('useSoreContext must be used within a SoreProvider');
  }
  return context;
};
