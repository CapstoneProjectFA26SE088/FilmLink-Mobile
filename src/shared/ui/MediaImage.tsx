import { Image } from 'react-native';
import { cn } from '@/shared/lib';
import { useTheme } from '@/shared/theme';

export type MediaImageProps = {
  readonly uri: string;
  readonly accessibilityLabel: string;
  readonly testID?: string;
  readonly className?: string;
};

export function MediaImage({ uri, accessibilityLabel, testID, className }: MediaImageProps) {
  const { palette } = useTheme();

  return (
    <Image
      testID={testID}
      source={{ uri }}
      accessibilityLabel={accessibilityLabel}
      resizeMode="cover"
      className={cn('h-44 w-full rounded', className)}
      style={{ backgroundColor: palette.surfaceMuted }}
    />
  );
}
