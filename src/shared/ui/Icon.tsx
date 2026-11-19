import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { useTheme } from '@/shared/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconTone =
  | 'default'
  | 'secondary'
  | 'muted'
  | 'brand'
  | 'inverse'
  | 'success'
  | 'warning'
  | 'danger';

const sizeMap: Record<IconSize, number> = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
};

export type IconProps = {
  readonly name: IconName;
  readonly size?: IconSize | number;
  readonly tone?: IconTone;
  readonly color?: string | null;
  readonly testID?: string;
};

export function Icon({ name, size = 'md', tone = 'default', color, testID }: IconProps) {
  const { palette } = useTheme();

  const toneMap: Record<IconTone, string> = {
    default: palette.textPrimary,
    secondary: palette.textSecondary,
    muted: palette.textMuted,
    brand: palette.brand,
    inverse: palette.brandForeground,
    success: palette.status.successText,
    warning: palette.status.warningText,
    danger: palette.status.errorText,
  };

  const resolvedSize = typeof size === 'number' ? size : sizeMap[size];
  const resolvedColor = (color ? String(color) : null) ?? toneMap[tone];

  return <Ionicons name={name} size={resolvedSize} color={resolvedColor} testID={testID} />;
}
