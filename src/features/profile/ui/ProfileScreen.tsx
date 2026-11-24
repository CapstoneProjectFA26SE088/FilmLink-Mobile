import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { filmLinkApi, filmLinkQueryKeys, ORDER_STALE_TIME_MS, sessionManager } from '@/shared/api';
import {
  authStore,
  checkRoleCapabilities,
  draftStore,
  Role,
  setAuthUser,
  updateProfile,
  validateProfileFullName,
} from '@/shared/domain';
import { raceTimeout } from '@/shared/hooks';
import { useStore } from '@/shared/lib';
import { useTheme } from '@/shared/theme';
import {
  Badge,
  Button,
  Card,
  FilterChipGroup,
  HStack,
  Input,
  Screen,
  Text,
  VStack,
} from '@/shared/ui';
import { describeThemeOption, THEME_OPTIONS } from '../model/profile';
import { ChangePasswordCard } from './ChangePasswordCard';

export function ProfileScreen() {
  const user = useStore(authStore, (state) => state.user);
  const isAuthenticated = useStore(authStore, (state) => state.isAuthenticated);
  const { data: accountProfile } = useQuery({
    queryKey: filmLinkQueryKeys.accounts.me(),
    queryFn: filmLinkApi.getMyAccount,
    staleTime: ORDER_STALE_TIME_MS,
    enabled: isAuthenticated,
  });

  const activeRole = accountProfile?.role ?? user?.role ?? Role.PHOTOGRAPHER;
  const { isExpert } = checkRoleCapabilities(activeRole);
  const { preference, resolvedTheme, setPreference } = useTheme();

  const [fullName, setFullName] = useState(accountProfile?.fullName ?? user?.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(
    accountProfile?.phoneNumber ?? user?.phoneNumber ?? '',
  );
  const [bio, setBio] = useState(user?.bio ?? '');
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSave = () => {
    const validationError = validateProfileFullName(fullName);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    updateProfile({
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      bio: bio.trim(),
    });
    setSavedNotice(true);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const session = sessionManager.getSession();
      if (session?.refreshToken) {
        await raceTimeout(filmLinkApi.logout({ refreshToken: session.refreshToken }), 3_000).catch(
          () => undefined,
        );
      }
      await sessionManager.endSession('signed-out');
      draftStore.reset();
      setAuthUser(null);
      router.replace('/(auth)/login');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Screen testID="profile.screen" scroll edges="top">
      <VStack gap="md">
        <VStack gap="none" className="pt-2">
          <Text variant="title">Hồ sơ & Cài đặt</Text>
          <Text variant="caption" tone="muted">
            Quản lý thông tin cá nhân, giao diện & bảo mật
          </Text>
        </VStack>
        <Card>
          <VStack gap="sm">
            <HStack justify="between" align="center">
              <VStack gap="none" className="flex-1">
                <Text variant="heading">
                  {accountProfile?.fullName ?? user?.fullName ?? 'Chưa đăng nhập'}
                </Text>
                <Text variant="caption" tone="muted">
                  {accountProfile?.email ?? user?.email ?? ''}
                </Text>
              </VStack>
              <Badge
                label={isExpert ? 'Expert' : 'Photographer'}
                tone={isExpert ? 'brand' : 'neutral'}
              />
            </HStack>

            <FilterChipGroup
              testIDPrefix="profile.theme"
              label={`Chế độ màu: ${describeThemeOption(preference)} · Đang hiển thị: ${resolvedTheme === 'dark' ? 'Tối' : 'Sáng'}`}
              options={THEME_OPTIONS}
              value={preference}
              onChange={setPreference}
            />

            {!isExpert ? (
              <Button
                testID="profile.open-upgrade"
                label="Nâng cấp Chuyên gia"
                size="sm"
                variant="secondary"
                onPress={() => router.push('/(modals)/expert-upgrade')}
              />
            ) : null}
          </VStack>
        </Card>

        <Card>
          <VStack gap="md">
            <Text variant="heading">Thông tin cá nhân</Text>
            <Input
              testID="profile.name"
              label="Họ và tên"
              value={fullName}
              onChangeText={(text) => {
                setSavedNotice(false);
                setFullName(text);
              }}
              error={error}
            />
            <Input
              testID="profile.phone"
              label="Số điện thoại"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
            <Input
              testID="profile.bio"
              label="Giới thiệu (Bio)"
              value={bio}
              onChangeText={setBio}
              multiline
            />
            {savedNotice ? (
              <Text variant="caption" tone="success">
                Đã lưu thay đổi hồ sơ.
              </Text>
            ) : null}
            <Button
              testID="profile.save"
              label="Lưu thay đổi"
              variant="primary"
              onPress={handleSave}
            />
          </VStack>
        </Card>

        <ChangePasswordCard />

        <Button
          testID="profile.logout"
          label={loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất khỏi thiết bị'}
          variant="danger"
          disabled={loggingOut}
          onPress={() => void handleLogout()}
        />
      </VStack>
    </Screen>
  );
}
