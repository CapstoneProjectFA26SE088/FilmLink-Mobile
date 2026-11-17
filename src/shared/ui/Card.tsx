import type { ReactNode } from 'react';
import { View } from 'react-native';
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
  readonly className?: string;
  readonly testID?: string;
};

export function Card({ children, tone = 'default', className, testID }: CardProps) {
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

  return (
    <View
      testID={testID}
      className={cn('rounded-lg border p-4', className)}
      style={{ backgroundColor: visual.bg, borderColor: visual.border }}
    >
      {children}
    </View>
  );
}
