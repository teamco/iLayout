import { create, createStore } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export type ThemeState = {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  cycleTheme: () => void;
};

const CYCLE: ThemeMode[] = ['light', 'dark', 'system'];
const STORAGE_KEY = 'theme-mode';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemTheme() : mode;
}

function loadMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && CYCLE.includes(stored as ThemeMode)) return stored as ThemeMode;
  } catch { /* ignore */ }
  return 'system';
}

function persistMode(mode: ThemeMode) {
  try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* ignore */ }
}

function makeStore(initialMode?: ThemeMode) {
  const mode = initialMode ?? loadMode();
  return {
    themeMode: mode,
    resolvedTheme: resolveTheme(mode),
    cycleTheme() {
      // Placeholder — overridden by zustand set()
    },
  };
}

/** Factory for testing — creates an isolated store instance */
export function createThemeStore(initialMode?: ThemeMode) {
  return createStore<ThemeState>()((set) => ({
    ...makeStore(initialMode),
    cycleTheme() {
      set((state) => {
        const idx = CYCLE.indexOf(state.themeMode);
        const next = CYCLE[(idx + 1) % CYCLE.length];
        persistMode(next);
        return { themeMode: next, resolvedTheme: resolveTheme(next) };
      });
    },
  }));
}

// Set data-theme before first render to avoid flash
if (typeof document !== 'undefined') {
  document.documentElement.dataset.theme = resolveTheme(loadMode());
}

/** Singleton store for app use */
export const useThemeStore = create<ThemeState>()((set) => ({
  ...makeStore(),
  cycleTheme() {
    set((state) => {
      const idx = CYCLE.indexOf(state.themeMode);
      const next = CYCLE[(idx + 1) % CYCLE.length];
      persistMode(next);
      return { themeMode: next, resolvedTheme: resolveTheme(next) };
    });
  },
}));

/** Call getSystemTheme() and update resolvedTheme if mode is 'system' */
export function syncSystemTheme() {
  const { themeMode } = useThemeStore.getState();
  if (themeMode === 'system') {
    useThemeStore.setState({ resolvedTheme: getSystemTheme() });
  }
}
