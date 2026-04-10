import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createThemeStore } from '../themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to system mode', () => {
    const store = createThemeStore();
    expect(store.getState().themeMode).toBe('system');
  });

  it('cycles light → dark → system → light', () => {
    const store = createThemeStore();
    store.getState().cycleTheme();
    expect(store.getState().themeMode).toBe('light');
    store.getState().cycleTheme();
    expect(store.getState().themeMode).toBe('dark');
    store.getState().cycleTheme();
    expect(store.getState().themeMode).toBe('system');
    store.getState().cycleTheme();
    expect(store.getState().themeMode).toBe('light');
  });

  it('resolves light/dark directly', () => {
    const store = createThemeStore();
    store.getState().cycleTheme(); // → light
    expect(store.getState().resolvedTheme).toBe('light');
    store.getState().cycleTheme(); // → dark
    expect(store.getState().resolvedTheme).toBe('dark');
  });

  it('resolves system to dark when matchMedia matches', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    const store = createThemeStore();
    expect(store.getState().themeMode).toBe('system');
    expect(store.getState().resolvedTheme).toBe('dark');
    vi.unstubAllGlobals();
  });

  it('resolves system to light when matchMedia does not match', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    const store = createThemeStore();
    expect(store.getState().themeMode).toBe('system');
    expect(store.getState().resolvedTheme).toBe('light');
    vi.unstubAllGlobals();
  });

  it('persists themeMode to localStorage', () => {
    const store = createThemeStore();
    store.getState().cycleTheme(); // → light
    expect(localStorage.getItem('theme-mode')).toBe('light');
  });

  it('restores themeMode from localStorage', () => {
    localStorage.setItem('theme-mode', 'dark');
    const store = createThemeStore();
    expect(store.getState().themeMode).toBe('dark');
    expect(store.getState().resolvedTheme).toBe('dark');
  });
});
