import { ActivityIndicator, Text as NativeText, Pressable } from 'react-native';
import { cn } from '@/shared/lib';
import { useTheme } from '@/shared/theme';

const sizeClass = {
  sm: 'min-h-9 px-3',
  md: 'min-h-12 px-5',
} as const;

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = keyof typeof sizeClass;

export type ButtonProps = {
  readonly label: string;
  readonly onPress: () => void;
  readonly testID: string;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
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
      className={cn(
        'flex-row items-center justify-center gap-2 rounded border',
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
      <NativeText
        className={cn(size === 'sm' ? 'text-sm font-semibold' : 'text-base font-semibold')}
        style={{ color: visual.text }}
      >
        {label}
      </NativeText>
    </Pressable>
  );
}
