import { Image } from 'react-native';
import { cn } from '@/shared/lib';
import { useTheme } from '@/shared/theme';

export type MediaImageProps = {
  readonly uri: string;
  readonly accessibilityLabel: string;
  readonly testID?: string;
  readonly className?: string;
  readonly resizeMode?: 'cover' | 'contain';
};

export function MediaImage({
  uri,
  accessibilityLabel,
  testID,
  className,
  resizeMode = 'cover',
}: MediaImageProps) {
  const { palette } = useTheme();

  return (
    <Image
      testID={testID}
      source={{ uri }}
      accessibilityLabel={accessibilityLabel}
      resizeMode={resizeMode}
      className={cn('h-44 w-full rounded', className)}
      style={{ backgroundColor: palette.surfaceMuted }}
    />
  );
}
