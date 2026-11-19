import { router } from 'expo-router';
import { Text as NativeText, Pressable, View } from 'react-native';
import { type ThemePreference, useTheme } from '@/shared/theme';
import { Badge } from './Badge';
import { Icon, type IconName } from './Icon';
import { HStack, VStack } from './Stack';
import { Text } from './Text';

const AI_LABEL = 'AI';
const PROFILE_LABEL = 'Hồ sơ';

const THEME_LABEL: Record<ThemePreference, string> = {
  system: 'Auto',
  light: 'Sáng',
  dark: 'Tối',
};

const THEME_ICON: Record<ThemePreference, IconName> = {
  system: 'contrast-outline',
  light: 'sunny-outline',
  dark: 'moon-outline',
};

export type AppHeaderProps = {
  readonly title: string;
  readonly subtitle?: string;
  readonly showBack?: boolean;
  readonly showRoleBadge?: boolean;
  readonly isExpert?: boolean;
  readonly onBack?: () => void;
  readonly onPressAiAdvisor?: () => void;
  readonly onPressProfile?: () => void;
  readonly testID?: string;
};

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  showRoleBadge = true,
  isExpert = false,
  onBack,
  onPressAiAdvisor,
  onPressProfile,
  testID,
}: AppHeaderProps) {
  const { palette, preference, cyclePreference } = useTheme();

  return (
    <View
      testID={testID}
      className="flex-row items-center justify-between gap-2 border-b px-4 py-2.5"
      style={{ backgroundColor: palette.background, borderBottomColor: palette.border }}
    >
      <HStack gap="sm" align="center" className="flex-1">
        {showBack ? (
          <Pressable
            testID="header.back"
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={onBack ?? (() => router.back())}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full active:opacity-75"
            style={{ backgroundColor: palette.surfaceMuted }}
          >
            <Icon name="arrow-back" size="sm" tone="default" />
          </Pressable>
        ) : null}
        <VStack gap="none" className="flex-1">
          <HStack gap="xs" align="center">
            <Text variant="heading" numberOfLines={1} accessibilityRole="header">
              {title}
            </Text>
            {showRoleBadge ? (
              <Badge
                label={isExpert ? 'Chuyên gia' : 'Nhiếp ảnh gia'}
                tone={isExpert ? 'brand' : 'neutral'}
              />
            ) : null}
          </HStack>
          {subtitle ? (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </VStack>
      </HStack>

      <HStack gap="xs" align="center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chuyển giao diện Sáng Tối Hệ thống"
          onPress={cyclePreference}
          hitSlop={6}
          className="h-9 flex-row items-center justify-center gap-1.5 rounded-full border px-2.5 active:opacity-80"
          style={{ backgroundColor: palette.surfaceMuted, borderColor: palette.border }}
        >
          <Icon name={THEME_ICON[preference]} size="xs" tone="secondary" />
          <NativeText
            testID="header.theme-toggle"
            className="text-xs font-semibold"
            style={{ color: palette.textPrimary }}
          >
            {THEME_LABEL[preference]}
          </NativeText>
        </Pressable>

        <Pressable
          testID="header.ai-advisor"
          accessibilityRole="button"
          accessibilityLabel="Mở Trợ lý AI FilmLink"
          onPress={onPressAiAdvisor ?? (() => router.push('/(modals)/ai-advisor'))}
          hitSlop={6}
          className="h-9 flex-row items-center justify-center gap-1 rounded-full px-2.5 active:opacity-80"
          style={{ backgroundColor: palette.brandSoft }}
        >
          <Icon name="sparkles" size="xs" tone="brand" />
          <NativeText className="text-xs font-bold" style={{ color: palette.brand }}>
            {AI_LABEL}
          </NativeText>
        </Pressable>

        <Pressable
          testID="header.profile"
          accessibilityRole="button"
          accessibilityLabel="Mở trang Tài khoản"
          onPress={onPressProfile ?? (() => router.push('/profile'))}
          hitSlop={6}
          className="h-9 flex-row items-center justify-center gap-1 rounded-full px-2.5 active:opacity-80"
          style={{ backgroundColor: palette.surfaceMuted }}
        >
          <Icon name="person-outline" size="xs" tone="secondary" />
          <NativeText className="text-xs font-semibold" style={{ color: palette.textPrimary }}>
            {PROFILE_LABEL}
          </NativeText>
        </Pressable>
      </HStack>
    </View>
  );
}
