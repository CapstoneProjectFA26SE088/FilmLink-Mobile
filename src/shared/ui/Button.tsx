import type { ReactNode } from 'react';
import { ActivityIndicator, Text as NativeText, Pressable } from 'react-native';
import { cn } from '@/shared/lib';
import { useTheme } from '@/shared/theme';

const sizeClass = {
  sm: 'min-h-9 h-9 px-3 py-1.5 rounded-lg',
  md: 'min-h-11 h-11 px-4 py-2 rounded-xl',
  lg: 'min-h-12 h-12 px-5 py-2.5 rounded-xl',
} as const;

const labelSizeClass = {
  sm: 'text-xs font-semibold',
  md: 'text-sm font-semibold',
  lg: 'text-base font-semibold',
} as const;

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = keyof typeof sizeClass;

export type ButtonProps = {
  readonly label: string;
  readonly onPress: () => void;
  readonly testID: string;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly icon?: ReactNode;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly className?: string;
};

export function Button({
  label,
  onPress,
  testID,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  className,
}: ButtonProps) {
  const { palette } = useTheme();
  const isDisabled = disabled || loading;

  const paletteMap: Record<
    ButtonVariant,
    { readonly bg: string; readonly border: string; readonly text: string }
  > = {
    primary: {
      bg: palette.brand,
      border: palette.brand,
      text: palette.brandForeground,
    },
    secondary: {
      bg: palette.brandSoft,
      border: palette.brandSoft,
      text: palette.brand,
    },
    outline: {
      bg: palette.surface,
      border: palette.borderStrong,
      text: palette.textPrimary,
    },
    danger: {
      bg: palette.status.errorBg,
      border: palette.status.errorText,
      text: palette.status.errorText,
    },
    ghost: {
      bg: 'transparent',
      border: 'transparent',
      text: palette.brand,
    },
  };

  const visual = paletteMap[variant];

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      hitSlop={8}
      className={cn(
        'flex-row items-center justify-center gap-2 border active:opacity-80',
        sizeClass[size],
        isDisabled && 'opacity-50',
        className,
      )}
      style={{
        backgroundColor: visual.bg,
        borderColor: visual.border,
      }}
    >
      {loading ? <ActivityIndicator size="small" color={visual.text} /> : null}
      {!loading && icon ? icon : null}
      <NativeText className={labelSizeClass[size]} style={{ color: visual.text }}>
        {label}
      </NativeText>
    </Pressable>
  );
}
