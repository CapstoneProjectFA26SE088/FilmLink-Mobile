import { Redirect } from 'expo-router';
import { authStore } from '@/shared/domain';
import { useStore } from '@/shared/lib';

export default function IndexGate() {
  const isAuthenticated = useStore(authStore, (state) => state.isAuthenticated);
  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/login'} />;
}
