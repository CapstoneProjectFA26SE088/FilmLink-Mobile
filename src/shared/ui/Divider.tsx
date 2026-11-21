import { View } from 'react-native';
import { useTheme } from '@/shared/theme';
import { Text } from './Text';

export type DividerProps = {
  readonly label?: string;
  readonly testID?: string;
};

export function Divider({ label, testID }: DividerProps) {
  const { palette } = useTheme();
  const line = <View className="h-px flex-1" style={{ backgroundColor: palette.border }} />;

  return (
    <View testID={testID} className="flex-row items-center gap-3">
      {line}
      {label ? (
        <Text variant="caption" tone="secondary" className="tracking-widest">
          {label}
        </Text>
      ) : null}
      {label ? line : null}
    </View>
  );
}
