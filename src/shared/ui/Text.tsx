import type { ReactNode } from 'react';
import { Text as NativeText } from 'react-native';
import { cn } from '@/shared/lib';
import { useTheme } from '@/shared/theme';

const variantClass = {
  title: 'text-2xl font-bold tracking-tight',
  section: 'text-xl font-bold tracking-tight',
  heading: 'text-lg font-semibold',
  body: 'text-base leading-relaxed',
  secondary: 'text-sm font-medium',
  caption: 'text-xs font-semibold tracking-wide',
  display: 'text-4xl font-extrabold tracking-tight',
} as const;

export type TextVariant = keyof typeof variantClass;
export type TextTone =
  | 'default'
  | 'secondary'
  | 'muted'
  | 'brand'
  | 'link'
  | 'inverse'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info';

export type TextProps = {
  readonly children: ReactNode;
  readonly variant?: TextVariant;
  readonly tone?: TextTone;
  readonly className?: string;
  readonly testID?: string;
  readonly numberOfLines?: number;
  readonly accessibilityRole?: 'header' | 'text';
};

export function Text({
  children,
  variant = 'body',
  tone = 'default',
  className,
  testID,
  numberOfLines,
  accessibilityRole = 'text',
}: TextProps) {
  const { palette } = useTheme();

  const colorMap: Record<TextTone, string> = {
    default: palette.textPrimary,
    secondary: palette.textSecondary,
    muted: palette.textMuted,
    brand: palette.brand,
    link: palette.link,
    inverse: palette.brandForeground,
    danger: palette.status.errorText,
    success: palette.status.successText,
    warning: palette.status.warningText,
    info: palette.status.infoText,
  };

  return (
    <NativeText
      testID={testID}
      numberOfLines={numberOfLines}
      accessibilityRole={accessibilityRole}
      className={cn(variantClass[variant], className)}
      style={{ color: colorMap[tone] }}
    >
      {children}
    </NativeText>
  );
}
