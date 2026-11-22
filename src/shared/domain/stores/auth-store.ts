import { createStore } from '@/shared/lib';
import { ExpertApplicationStatus, Role } from '../enums';
import type { ExpertUpgradeApplication, UserAccount } from '../types';

export type AuthStoreState = {
  readonly user: UserAccount | null;
  readonly isAuthenticated: boolean;
  readonly isHydrated: boolean;
  readonly expertApplication: ExpertUpgradeApplication | null;
};

export const authStore = createStore<AuthStoreState>({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  expertApplication: null,
});

export function logoutUser(): void {
  authStore.setState((prev) => ({
    ...prev,
    user: null,
    isAuthenticated: false,
    expertApplication: null,
  }));
}

export function setAuthUser(user: UserAccount | null): void {
  authStore.setState((prev) => ({
    ...prev,
    user,
    isAuthenticated: user !== null,
    expertApplication: user ? prev.expertApplication : null,
  }));
}

export function setAuthHydrated(isHydrated: boolean): void {
  authStore.setState((prev) => ({
    ...prev,
    isHydrated,
  }));
}

export function updateProfile(updates: Partial<UserAccount>): void {
  authStore.setState((prev) => ({
    ...prev,
    user: prev.user ? { ...prev.user, ...updates } : null,
  }));
}

export function switchUserRole(role: Role): void {
  authStore.setState((prev) => ({
    ...prev,
    user: prev.user ? { ...prev.user, role } : null,
  }));
}

export function submitExpertApplication(payload: {
  readonly userId: string;
  readonly fullName: string;
  readonly email: string;
  readonly specialization: string;
  readonly experience: string;
  readonly portfolioUrl?: string;
}): void {
  authStore.setState((prev) => ({
    ...prev,
    expertApplication: {
      ...payload,
      id: `EXP-${Date.now().toString().slice(-4)}`,
      status: ExpertApplicationStatus.PENDING,
      submittedAt: new Date().toISOString(),
    },
  }));
}

export function approveExpertApplicationDemo(): void {
  authStore.setState((prev) => {
    const existing = prev.expertApplication;
    const approvedApp: ExpertUpgradeApplication = existing
      ? { ...existing, status: ExpertApplicationStatus.APPROVED }
      : {
          id: 'EXP-8899',
          userId: prev.user?.id ?? 'USR-1024',
          fullName: prev.user?.fullName ?? 'Minh Khôi Analog',
          email: prev.user?.email ?? 'photographer@filmlink.vn',
          experience: '8 năm chụp và tự tráng phim Đen Trắng, C-41 tại buồng tối cá nhân.',
          specialization: 'Buồng tối B&W & Máy ảnh cơ học',
          status: ExpertApplicationStatus.APPROVED,
          submittedAt: new Date().toISOString(),
        };
    return {
      ...prev,
      expertApplication: approvedApp,
      user: prev.user ? { ...prev.user, role: Role.PHOTOGRAPHY_EXPERT } : null,
    };
  });
}
