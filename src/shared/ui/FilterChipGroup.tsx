import { Text as NativeText, Pressable, ScrollView, View } from 'react-native';
import { cn } from '@/shared/lib';
import { useTheme } from '@/shared/theme';
import { Text } from './Text';

export type FilterChipOption<T extends string> = {
  readonly value: T;
  readonly label: string;
};

export type FilterChipGroupProps<T extends string> = {
  readonly label?: string;
  readonly options: readonly FilterChipOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly testIDPrefix: string;
  readonly scrollable?: boolean;
  readonly className?: string;
};

export function FilterChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  testIDPrefix,
  scrollable = false,
  className,
}: FilterChipGroupProps<T>) {
  const { palette } = useTheme();

  const chips = options.map((opt) => {
    const active = opt.value === value;
    return (
      <Pressable
        key={opt.value}
        testID={`${testIDPrefix}.${opt.value}`}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={() => onChange(opt.value)}
        className="rounded-full border px-3 py-1.5"
        style={{
          backgroundColor: active ? palette.brandSoft : palette.surface,
          borderColor: active ? palette.brand : palette.border,
        }}
      >
        <NativeText
          className="text-xs font-semibold"
          style={{ color: active ? palette.brand : palette.textSecondary }}
        >
          {opt.label}
        </NativeText>
      </Pressable>
    );
  });

  return (
    <View className={cn('gap-1.5', className)}>
      {label ? (
        <Text variant="caption" tone="muted">
          {label}
        </Text>
      ) : null}
      {scrollable ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          {chips}
        </ScrollView>
      ) : (
        <View className="flex-row flex-wrap gap-2">{chips}</View>
      )}
    </View>
  );
}
