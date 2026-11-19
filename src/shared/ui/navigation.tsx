import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useTheme } from '@/shared/theme';
import { AiTabButton } from './AiTabButton';
import { Icon, type IconName } from './Icon';

type ScreenOptions = Extract<
  NonNullable<ComponentProps<typeof Tabs.Screen>['options']>,
  Record<string, unknown>
>;
type TabsOptions = Extract<
  NonNullable<ComponentProps<typeof Tabs>['screenOptions']>,
  Record<string, unknown>
>;

export function tabScreenOptions(title: string, icon: IconName, href?: null): ScreenOptions {
  return {
    title,
    href,
    tabBarIcon: ({ color, size }: { readonly color: unknown; readonly size: number }) => (
      <Icon name={icon} color={color ? String(color) : null} size={size} />
    ),
  };
}

export function aiTabScreenOptions(): ScreenOptions {
  return {
    title: 'AI',
    tabBarButton: () => <AiTabButton />,
  };
}

export function useTabScreenTheme(): TabsOptions {
  const { palette } = useTheme();
  return {
    headerShown: false,
    tabBarShowLabel: false,
    tabBarActiveTintColor: palette.brand,
    tabBarInactiveTintColor: palette.textSecondary,
    tabBarStyle: {
      backgroundColor: palette.surface,
      borderTopColor: palette.border,
      overflow: 'visible',
    },
  };
}
