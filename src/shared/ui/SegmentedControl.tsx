import { Text as NativeText, Pressable, View } from 'react-native';
import { cn } from '@/shared/lib';
import { useTheme } from '@/shared/theme';

export type SegmentedOption<T extends string> = {
  readonly value: T;
  readonly label: string;
  readonly count?: number;
};

export type SegmentedControlProps<T extends string> = {
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly testIDPrefix: string;
  readonly className?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  testIDPrefix,
  className,
}: SegmentedControlProps<T>) {
  const { palette } = useTheme();

  return (
    <View
      className={cn('flex-row rounded-2xl border p-1', className)}
      style={{ backgroundColor: palette.surfaceMuted, borderColor: palette.border }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const label = opt.count !== undefined ? `${opt.label} (${opt.count})` : opt.label;
        return (
          <Pressable
            key={opt.value}
            testID={`${testIDPrefix}.${opt.value}`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.value)}
            hitSlop={6}
            className="flex-1 items-center justify-center rounded-xl min-h-10 px-2 py-1.5 active:opacity-80"
            style={{ backgroundColor: active ? palette.surface : 'transparent' }}
          >
            <NativeText
              className="text-xs font-bold"
              numberOfLines={1}
              style={{ color: active ? palette.brand : palette.textSecondary }}
            >
              {label}
            </NativeText>
          </Pressable>
        );
      })}
    </View>
  );
}
