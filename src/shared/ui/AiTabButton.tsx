import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/shared/theme';
import { Text } from './Text';

export type AiTabButtonProps = {
  readonly onPress?: () => void;
  readonly testID?: string;
};

export function AiTabButton({ onPress, testID = 'tabs.ai-advisor' }: AiTabButtonProps) {
  const { palette } = useTheme();

  return (
    <View className="flex-1 items-center">
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel="Mở Trợ lý AI FilmLink"
        onPress={onPress ?? (() => router.push('/(modals)/ai-advisor'))}
        hitSlop={8}
        className="-mt-6 h-16 w-16 items-center justify-center rounded-full border-4 active:scale-95 active:opacity-90"
        style={{
          backgroundColor: palette.brand,
          borderColor: palette.surface,
          shadowColor: palette.brand,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Text variant="section" tone="inverse" className="font-extrabold tracking-wide">
          AI
        </Text>
      </Pressable>
    </View>
  );
}
