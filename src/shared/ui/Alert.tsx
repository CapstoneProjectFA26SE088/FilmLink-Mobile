import type { ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '@/shared/lib';
import { useTheme } from '@/shared/theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type AlertTone = 'danger' | 'warning' | 'info' | 'success';

export type AlertProps = {
  readonly message?: string;
  readonly children?: ReactNode;
  readonly testID: string;
  readonly tone?: AlertTone;
  readonly className?: string;
};

const TONE_ICON: Record<AlertTone, IconName> = {
  danger: 'alert-circle',
  warning: 'warning',
  info: 'information-circle',
  success: 'checkmark-circle',
};

export function Alert({ message, children, testID, tone = 'danger', className }: AlertProps) {
  const { palette } = useTheme();

  const toneMap: Record<
    AlertTone,
    { readonly bg: string; readonly border: string; readonly fg: string }
  > = {
    danger: {
      bg: palette.status.errorBg,
      border: palette.status.errorBorder,
      fg: palette.status.errorText,
    },
    warning: {
      bg: palette.status.warningBg,
      border: palette.status.warningBorder,
      fg: palette.status.warningText,
    },
    info: {
      bg: palette.status.infoBg,
      border: palette.status.infoBorder,
      fg: palette.status.infoText,
    },
    success: {
      bg: palette.status.successBg,
      border: palette.status.successBorder,
      fg: palette.status.successText,
    },
  };
  const visual = toneMap[tone];

  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={cn('flex-row items-start gap-2 rounded border px-3 py-2.5', className)}
      style={{ backgroundColor: visual.bg, borderColor: visual.border }}
    >
      <View
        className="mt-0.5"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Icon name={TONE_ICON[tone]} size="sm" color={visual.fg} />
      </View>
      <View className="flex-1">
        <Text variant="secondary" tone={tone} className="leading-5">
          {message ?? children}
        </Text>
      </View>
    </View>
  );
}
