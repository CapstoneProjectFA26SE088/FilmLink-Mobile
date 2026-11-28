import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSessionBootstrap } from '@/shared/hooks';
import { AppProviders } from '@/shared/providers';
import { useTheme } from '@/shared/theme';

function RootNavigator() {
  const { isDark, palette } = useTheme();
  useSessionBootstrap();
  const modalOptions = { presentation: 'modal', animation: 'slide_from_bottom' } as const;
  const contentStyle = { backgroundColor: palette.background };
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle }}>
        <Stack.Screen name="(modals)/ai-advisor" options={modalOptions} />
        <Stack.Screen name="(modals)/expert-upgrade" options={modalOptions} />
        <Stack.Screen name="(modals)/negative-preview" options={modalOptions} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
