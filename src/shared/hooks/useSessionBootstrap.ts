import { router, useRootNavigationState, useSegments } from 'expo-router';
import { useEffect } from 'react';
import {
  type AuthSession,
  filmLinkApi,
  isSupportedMobileRole,
  sessionManager,
  type UserAccountResponse,
} from '@/shared/api';
import {
  AccountStatus,
  authStore,
  setAuthHydrated,
  setAuthUser,
  type UserAccount,
} from '@/shared/domain';
import { useStore } from '@/shared/lib';

export function sessionToUserAccount(session: AuthSession): UserAccount {
  const emailName = session.email.split('@')[0]?.trim() || 'FilmLink Member';
  return {
    id: String(session.accountId),
    email: session.email,
    fullName: emailName,
    role: session.role,
    status: AccountStatus.ACTIVE,
    joinedAt: new Date().toISOString(),
  };
}

export function accountResponseToUser(account: UserAccountResponse): UserAccount {
  return {
    id: String(account.id),
    email: account.email,
    fullName: account.fullName,
    phoneNumber: account.phoneNumber ?? undefined,
    role: account.role,
    status: account.status,
    joinedAt: account.createdAt,
  };
}

export type SessionBootstrapState = {
  readonly isHydrated: boolean;
  readonly isAuthenticated: boolean;
};

async function hydrateStoredSession(isActive: () => boolean): Promise<void> {
  const session = await sessionManager.hydrate().catch(() => null);
  if (!isActive()) {
    return;
  }
  if (!session) {
    setAuthUser(null);
    setAuthHydrated(true);
    return;
  }
  if (!isSupportedMobileRole(session.role)) {
    await sessionManager.endSession('unsupported-role');
    if (isActive()) {
      setAuthUser(null);
      setAuthHydrated(true);
    }
    return;
  }
  setAuthUser(sessionToUserAccount(session));
  setAuthHydrated(true);
  const profile = await filmLinkApi.getMyAccount().catch(() => null);
  if (isActive() && profile && sessionManager.getSession()) {
    setAuthUser(accountResponseToUser(profile));
  }
}

export function useSessionBootstrap(): SessionBootstrapState {
  const isHydrated = useStore(authStore, (state) => state.isHydrated);
  const isAuthenticated = useStore(authStore, (state) => state.isAuthenticated);
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();
  const isNavReady = Boolean(rootNavigationState?.key);
  const firstSegment = segments[0];

  useEffect(() => {
    let active = true;
    const unsubscribe = sessionManager.subscribe((session) => {
      if (!active) {
        return;
      }
      if (!session) {
        setAuthUser(null);
        return;
      }
      if (!isSupportedMobileRole(session.role)) {
        void sessionManager.endSession('unsupported-role');
        setAuthUser(null);
        return;
      }
      if (!authStore.getState().user) {
        setAuthUser(sessionToUserAccount(session));
      }
    });

    void hydrateStoredSession(() => active);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isHydrated || !isNavReady) {
      return;
    }
    const inAuthGroup = firstSegment === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isHydrated, isNavReady, isAuthenticated, firstSegment]);

  return { isHydrated, isAuthenticated };
}
