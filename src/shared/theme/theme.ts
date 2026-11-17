import { colorScheme } from 'nativewind';
import { useColorScheme } from 'react-native';
import { createStore, useStore } from '@/shared/lib';
import { darkPalette, lightPalette, type ThemePalette } from './tokens';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const themeStore = createStore<{ readonly preference: ThemePreference }>({
  preference: 'system',
});

export function resolveThemeMode(
  preference: ThemePreference,
  systemScheme: 'light' | 'dark' | 'unspecified' | null | undefined,
): ResolvedTheme {
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function nextThemePreference(current: ThemePreference): ThemePreference {
  switch (current) {
    case 'system':
      return 'light';
    case 'light':
      return 'dark';
    case 'dark':
      return 'system';
  }
}

export function getThemePalette(resolved: ResolvedTheme): ThemePalette {
  return resolved === 'dark' ? darkPalette : lightPalette;
}

export function setThemePreference(preference: ThemePreference): void {
  themeStore.setState({ preference });
  try {
    colorScheme.set(preference);
  } catch {
    return;
  }
}

export function cycleThemePreference(): void {
  setThemePreference(nextThemePreference(themeStore.getState().preference));
}

export type ActiveTheme = {
  readonly preference: ThemePreference;
  readonly resolvedTheme: ResolvedTheme;
  readonly isDark: boolean;
  readonly palette: ThemePalette;
  readonly setPreference: (preference: ThemePreference) => void;
  readonly cyclePreference: () => void;
};

export function useTheme(): ActiveTheme {
  const systemScheme = useColorScheme();
  const preference = useStore(themeStore, (state) => state.preference);
  const resolvedTheme = resolveThemeMode(preference, systemScheme);
  return {
    preference,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    palette: getThemePalette(resolvedTheme),
    setPreference: setThemePreference,
    cyclePreference: cycleThemePreference,
  };
}
