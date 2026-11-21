import { Pressable } from 'react-native';
import { cn } from '@/shared/lib';
import { useTheme } from '@/shared/theme';
import { Icon, type IconName } from './Icon';

export type IconButtonProps = {
  readonly icon: IconName;
  readonly onPress: () => void;
  readonly testID: string;
  readonly accessibilityLabel: string;
  readonly className?: string;
};

export function IconButton({
  icon,
  onPress,
  testID,
  accessibilityLabel,
  className,
}: IconButtonProps) {
  const { palette } = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      className={cn(
        'h-11 w-11 items-center justify-center rounded-full border active:opacity-80',
        className,
      )}
      style={{
        backgroundColor: palette.surface,
        borderColor: palette.border,
      }}
    >
      <Icon name={icon} size="sm" tone="default" />
    </Pressable>
  );
}
