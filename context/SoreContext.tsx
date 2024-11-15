import type { ReactNode } from 'react';
import type React from 'react';
import { createContext, useContext, useState, useMemo } from 'react';

import { Sore } from '@/types';

interface SoreContextProps {
  sores: Sore[];
  setSores: React.Dispatch<React.SetStateAction<Sore[]>>;
  selectedSore: Sore | null;
  setSelectedSore: React.Dispatch<React.SetStateAction<Sore | null>>;
  mode: 'add' | 'edit' | 'update' | 'view';
  setMode: React.Dispatch<
    React.SetStateAction<'add' | 'edit' | 'update' | 'view'>
  >;
}

interface SoreProviderProps {
  children: ReactNode;
}

const SoreContext = createContext<SoreContextProps | undefined>(undefined);

export const SoreProvider: React.FC<SoreProviderProps> = ({ children }) => {
  const [sores, setSores] = useState<Sore[]>([]);
  const [selectedSore, setSelectedSore] = useState<Sore | null>(null);
  const [mode, setMode] = useState<'add' | 'edit' | 'update' | 'view'>('view');

  const contextValue = useMemo(
    () => ({
      sores,
      setSores,
      selectedSore,
      setSelectedSore,
      mode,
      setMode
    }),
    [sores, selectedSore, mode]
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
