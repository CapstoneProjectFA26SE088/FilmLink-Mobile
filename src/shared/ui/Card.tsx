import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { cn } from '@/shared/lib';
import { useTheme } from '@/shared/theme';

export type CardTone =
  | 'default'
  | 'muted'
  | 'brand'
  | 'elevated'
  | 'success'
  | 'warning'
  | 'danger';

export type CardProps = {
  readonly children: ReactNode;
  readonly tone?: CardTone;
  readonly onPress?: () => void;
  readonly className?: string;
  readonly testID?: string;
};

export function Card({ children, tone = 'default', onPress, className, testID }: CardProps) {
  const { palette } = useTheme();

  const toneMap: Record<CardTone, { readonly bg: string; readonly border: string }> = {
    default: { bg: palette.surface, border: palette.border },
    muted: { bg: palette.surfaceMuted, border: palette.border },
    brand: { bg: palette.brandSoft, border: palette.brand },
    elevated: { bg: palette.surfaceElevated, border: palette.borderStrong },
    success: { bg: palette.status.successBg, border: palette.status.successText },
    warning: { bg: palette.status.warningBg, border: palette.status.warningText },
    danger: { bg: palette.status.errorBg, border: palette.status.errorText },
  };

  const visual = toneMap[tone];
  const cardClassName = cn('rounded-2xl border p-4', onPress && 'active:opacity-90', className);

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        onPress={onPress}
        className={cardClassName}
        style={{ backgroundColor: visual.bg, borderColor: visual.border }}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      testID={testID}
      className={cardClassName}
      style={{ backgroundColor: visual.bg, borderColor: visual.border }}
    >
      {children}
    </View>
  );
}
