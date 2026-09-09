import type { ReactNode } from 'react';
import type React from 'react';
import { createContext, useContext, useState, useMemo } from 'react';

import { Sore } from '@/types';

interface SoreContextProps {
  selectedSore: Sore | null;
  setSelectedSore: React.Dispatch<React.SetStateAction<Sore | null>>;
  sores: Sore[];
  setSores: React.Dispatch<React.SetStateAction<Sore[]>>;
  mode: 'add' | 'edit' | 'update' | 'view';
  setMode: React.Dispatch<
    React.SetStateAction<'add' | 'edit' | 'update' | 'view'>
  >;
}

interface SoreProviderProps {
  children: ReactNode;
  initialSores: Sore[];
}

const SoreContext = createContext<SoreContextProps | undefined>(undefined);

export const SoreProvider: React.FC<SoreProviderProps> = ({
  children,
  initialSores
}) => {
  const [selectedSore, setSelectedSore] = useState<Sore | null>(null);
  const [sores, setSores] = useState<Sore[]>(initialSores);
  const [mode, setMode] = useState<'add' | 'edit' | 'update' | 'view'>('view');

  const contextValue = useMemo(
    () => ({
      selectedSore,
      setSelectedSore,
      sores,
      setSores,
      mode,
      setMode
    }),
    [selectedSore, sores, mode]
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
