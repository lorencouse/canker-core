import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

export type ThemeSetting = 'light' | 'dark' | 'system';

interface ThemeState {
  setting: ThemeSetting;
  resolved: 'light' | 'dark';
  setSetting(next: ThemeSetting): void;
}

const ThemeContext = createContext<ThemeState | null>(null);
const KEY = 'canker.theme';

function readSetting(): ThemeSetting {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

function systemDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [setting, setSettingState] = useState<ThemeSetting>(readSetting);
  const [sysDark, setSysDark] = useState(systemDark);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSysDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolved = setting === 'system' ? (sysDark ? 'dark' : 'light') : setting;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, [resolved]);

  const setSetting = useCallback((next: ThemeSetting) => {
    setSettingState(next);
    try {
      if (next === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {
      /* storage unavailable; theme still applies for this session */
    }
  }, []);

  const value = useMemo(
    () => ({ setting, resolved, setSetting }),
    [setting, resolved, setSetting]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
