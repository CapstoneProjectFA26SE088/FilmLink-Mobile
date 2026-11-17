import { router } from 'expo-router';
import { Text as NativeText, Pressable, View } from 'react-native';
import { type ThemePreference, useTheme } from '@/shared/theme';
import { Badge } from './Badge';
import { HStack, VStack } from './Stack';
import { Text } from './Text';

const BACK_GLYPH = '←';
const AI_LABEL = 'AI';
const PROFILE_LABEL = 'Hồ sơ';

const THEME_LABEL: Record<ThemePreference, string> = {
  system: 'Auto',
  light: 'Sáng',
  dark: 'Tối',
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
      className="flex-row items-center justify-between gap-2 border-b px-4 py-3"
      style={{ backgroundColor: palette.background, borderBottomColor: palette.border }}
    >
      <HStack gap="sm" align="center" className="flex-1">
        {showBack ? (
          <Pressable
            testID="header.back"
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={onBack ?? (() => router.back())}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: palette.surfaceMuted }}
          >
            <NativeText className="text-base font-bold" style={{ color: palette.textPrimary }}>
              {BACK_GLYPH}
            </NativeText>
          </Pressable>
        ) : null}
        <VStack gap="none" className="flex-1">
          <HStack gap="xs" align="center">
            <Text variant="heading" numberOfLines={1} accessibilityRole="header">
              {title}
            </Text>
            {showRoleBadge ? (
              <Badge
                label={isExpert ? 'Expert' : 'Photographer'}
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
          testID="header.theme-toggle"
          accessibilityRole="button"
          accessibilityLabel="Chuyển giao diện Sáng Tối Hệ thống"
          onPress={cyclePreference}
          className="h-9 items-center justify-center rounded-full border px-2.5"
          style={{ backgroundColor: palette.surfaceMuted, borderColor: palette.border }}
        >
          <NativeText className="text-xs font-semibold" style={{ color: palette.textPrimary }}>
            {THEME_LABEL[preference]}
          </NativeText>
        </Pressable>

        <Pressable
          testID="header.ai-advisor"
          accessibilityRole="button"
          accessibilityLabel="Mở Trợ lý AI FilmLink"
          onPress={onPressAiAdvisor ?? (() => router.push('/(modals)/ai-advisor'))}
          className="h-9 items-center justify-center rounded-full px-2.5"
          style={{ backgroundColor: palette.brandSoft }}
        >
          <NativeText className="text-xs font-bold" style={{ color: palette.brand }}>
            {AI_LABEL}
          </NativeText>
        </Pressable>

        <Pressable
          testID="header.profile"
          accessibilityRole="button"
          accessibilityLabel="Mở trang Tài khoản"
          onPress={onPressProfile ?? (() => router.push('/profile'))}
          className="h-9 items-center justify-center rounded-full px-2.5"
          style={{ backgroundColor: palette.surfaceMuted }}
        >
          <NativeText className="text-xs font-semibold" style={{ color: palette.textPrimary }}>
            {PROFILE_LABEL}
          </NativeText>
        </Pressable>
      </HStack>
    </View>
  );
}
