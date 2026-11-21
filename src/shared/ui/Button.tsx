import type { ReactNode } from 'react';
import { ActivityIndicator, Text as NativeText, Pressable, type ViewStyle } from 'react-native';
import { cn } from '@/shared/lib';
import { useTheme } from '@/shared/theme';

const sizeClass = {
  sm: 'min-h-9 h-9 px-3 py-1.5 rounded',
  md: 'min-h-11 h-11 px-4 py-2 rounded',
  lg: 'min-h-12 h-12 px-5 py-2.5 rounded',
} as const;

const labelSizeClass = {
  sm: 'text-xs font-semibold',
  md: 'text-sm font-semibold',
  lg: 'text-base font-semibold',
} as const;

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'link';
export type ButtonSize = keyof typeof sizeClass;

export type ButtonProps = {
  readonly label: string;
  readonly onPress: () => void;
  readonly testID: string;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly icon?: ReactNode;
  readonly trailingIcon?: ReactNode;
  readonly elevated?: boolean;
  readonly underline?: boolean;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly className?: string;
};

type ButtonVisual = { readonly bg: string; readonly border: string; readonly text: string };

function buildButtonStyle(
  visual: ButtonVisual,
  elevated: boolean,
  brandShadowColor: string,
): ViewStyle {
  if (!elevated) {
    return { backgroundColor: visual.bg, borderColor: visual.border };
  }
  return {
    backgroundColor: visual.bg,
    borderColor: visual.border,
    minHeight: 50,
    shadowColor: brandShadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  };
}

export function Button({
  label,
  onPress,
  testID,
  variant = 'primary',
  size = 'md',
  icon,
  trailingIcon,
  elevated = false,
  underline = false,
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
    link: {
      bg: 'transparent',
      border: 'transparent',
      text: palette.link,
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
      style={buildButtonStyle(visual, elevated, palette.brand)}
    >
      {loading ? <ActivityIndicator size="small" color={visual.text} /> : null}
      {!loading && icon ? icon : null}
      <NativeText
        className={cn(labelSizeClass[size], underline && 'underline')}
        style={{ color: visual.text }}
      >
        {label}
      </NativeText>
      {!loading && trailingIcon ? trailingIcon : null}
    </Pressable>
  );
}
