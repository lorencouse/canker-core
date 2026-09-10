import type { ReactNode } from 'react';
import type React from 'react';
import { createContext, useContext, useState, useMemo } from 'react';

import { Sore } from '@/types';

/** 'add' places new sores, 'edit' drags existing ones, 'view' does neither. */
type Mode = 'add' | 'edit' | 'view';

interface SoreContextProps {
  selectedSore: Sore | null;
  setSelectedSore: React.Dispatch<React.SetStateAction<Sore | null>>;
  /** Every sore the user has, healed or not. */
  sores: Sore[];
  setSores: React.Dispatch<React.SetStateAction<Sore[]>>;
  /**
   * The sores the map and navigator currently show. Healed sores are hidden
   * by default: the map is for what hurts now, and a year of healed marks
   * would bury the one that does.
   */
  visibleSores: Sore[];
  showHealed: boolean;
  setShowHealed: React.Dispatch<React.SetStateAction<boolean>>;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  /**
   * The sores as they were when the current editing session opened, so
   * Cancel can put them back.
   *
   * This lives in the context rather than inside the action bar because the
   * action bar is rendered in different places at different widths — under
   * the map on a desktop, inside the detail sheet on a phone. Local state
   * would give each of those its own idea of what Cancel undoes.
   */
  snapshot: Sore[] | null;
  setSnapshot: React.Dispatch<React.SetStateAction<Sore[] | null>>;
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
  const [showHealed, setShowHealed] = useState(false);
  const [mode, setMode] = useState<Mode>('view');
  const [snapshot, setSnapshot] = useState<Sore[] | null>(null);

  const visibleSores = useMemo(
    () => (showHealed ? sores : sores.filter((s) => !s.healed)),
    [sores, showHealed]
  );

  const contextValue = useMemo(
    () => ({
      selectedSore,
      setSelectedSore,
      sores,
      setSores,
      visibleSores,
      showHealed,
      setShowHealed,
      mode,
      setMode,
      snapshot,
      setSnapshot
    }),
    [selectedSore, sores, visibleSores, showHealed, mode, snapshot]
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
