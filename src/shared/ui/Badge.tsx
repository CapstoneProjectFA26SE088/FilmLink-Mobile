import type { ReactNode } from 'react';
import { Text as NativeText, Pressable, View } from 'react-native';
import { cn } from '@/shared/lib';
import { useTheme } from '@/shared/theme';

export type BadgeTone = 'neutral' | 'brand' | 'surface' | 'success' | 'warning' | 'danger' | 'info';

export type BadgeProps = {
  readonly label: string;
  readonly tone?: BadgeTone;
  readonly dot?: boolean;
  readonly icon?: ReactNode;
  readonly trailingIcon?: ReactNode;
  readonly onPress?: () => void;
  readonly accessibilityLabel?: string;
  readonly testID?: string;
  readonly className?: string;
};

export function Badge({
  label,
  tone = 'neutral',
  dot = false,
  icon,
  trailingIcon,
  onPress,
  accessibilityLabel,
  testID,
  className,
}: BadgeProps) {
  const { palette } = useTheme();

  const toneMap: Record<
    BadgeTone,
    { readonly bg: string; readonly border: string; readonly text: string }
  > = {
    neutral: {
      bg: palette.surfaceMuted,
      border: palette.border,
      text: palette.textSecondary,
    },
    brand: {
      bg: palette.brandSoft,
      border: palette.brand,
      text: palette.link,
    },
    surface: {
      bg: palette.surface,
      border: palette.border,
      text: palette.textPrimary,
    },
    success: {
      bg: palette.status.successBg,
      border: palette.status.successText,
      text: palette.status.successText,
    },
    warning: {
      bg: palette.status.warningBg,
      border: palette.status.warningText,
      text: palette.status.warningText,
    },
    danger: {
      bg: palette.status.errorBg,
      border: palette.status.errorText,
      text: palette.status.errorText,
    },
    info: {
      bg: palette.status.infoBg,
      border: palette.status.infoText,
      text: palette.status.infoText,
    },
  };

  const visual = toneMap[tone];
  const containerClass = cn(
    'self-start flex-row items-center gap-1.5 rounded-full border px-2.5 py-0.5',
    onPress && 'active:opacity-80',
    className,
  );
  const content = (
    <>
      {dot ? (
        <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: palette.brand }} />
      ) : null}
      {icon}
      <NativeText className="text-xs font-semibold tracking-wide" style={{ color: visual.text }}>
        {label}
      </NativeText>
      {trailingIcon}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        hitSlop={6}
        onPress={onPress}
        className={containerClass}
        style={{ backgroundColor: visual.bg, borderColor: visual.border }}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      testID={testID}
      className={containerClass}
      style={{ backgroundColor: visual.bg, borderColor: visual.border }}
    >
      {content}
    </View>
  );
}
