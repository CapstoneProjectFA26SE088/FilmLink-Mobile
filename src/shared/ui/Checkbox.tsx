import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { cn } from '@/shared/lib';
import { useTheme } from '@/shared/theme';
import { Icon } from './Icon';

export type CheckboxProps = {
  readonly checked: boolean;
  readonly onToggle: () => void;
  readonly children: ReactNode;
  readonly testID: string;
  readonly accessibilityLabel: string;
  readonly className?: string;
};

export function Checkbox({
  checked,
  onToggle,
  children,
  testID,
  accessibilityLabel,
  className,
}: CheckboxProps) {
  const { palette } = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
      onPress={onToggle}
      hitSlop={8}
      className={cn('flex-row items-start gap-2.5 py-1 active:opacity-80', className)}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="mt-0.5 h-5 w-5 items-center justify-center rounded-xs border"
        style={{
          backgroundColor: checked ? palette.brand : palette.surface,
          borderColor: checked ? palette.brand : palette.borderStrong,
        }}
      >
        {checked ? <Icon name="checkmark" size="xs" tone="inverse" /> : null}
      </View>
      <View className="flex-1">{children}</View>
    </Pressable>
  );
}
