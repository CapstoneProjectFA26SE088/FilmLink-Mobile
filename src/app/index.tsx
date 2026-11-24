import { Redirect } from 'expo-router';
import { authStore } from '@/shared/domain';
import { useStore } from '@/shared/lib';

export default function IndexGate() {
  const isHydrated = useStore(authStore, (state) => state.isHydrated);
  const isAuthenticated = useStore(authStore, (state) => state.isAuthenticated);

  if (!isHydrated) {
    return null;
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/login'} />;
}
