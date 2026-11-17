import { Text as NativeText, View } from 'react-native';
import { cn } from '@/shared/lib';
import { useTheme } from '@/shared/theme';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

export type BadgeProps = {
  readonly label: string;
  readonly tone?: BadgeTone;
  readonly testID?: string;
  readonly className?: string;
};

export function Badge({ label, tone = 'neutral', testID, className }: BadgeProps) {
  const { palette } = useTheme();

  const toneMap: Record<BadgeTone, { readonly bg: string; readonly text: string }> = {
    neutral: { bg: palette.surfaceMuted, text: palette.textSecondary },
    brand: { bg: palette.brandSoft, text: palette.brand },
    success: { bg: palette.status.successBg, text: palette.status.successText },
    warning: { bg: palette.status.warningBg, text: palette.status.warningText },
    danger: { bg: palette.status.errorBg, text: palette.status.errorText },
    info: { bg: palette.status.infoBg, text: palette.status.infoText },
  };

  const visual = toneMap[tone];

  return (
    <View
      testID={testID}
      className={cn('self-start rounded-full px-2.5 py-1', className)}
      style={{ backgroundColor: visual.bg }}
    >
      <NativeText className="text-xs font-semibold" style={{ color: visual.text }}>
        {label}
      </NativeText>
    </View>
  );
}
