import { View } from 'react-native';
import { cn } from '@/shared/lib';
import { useTheme } from '@/shared/theme';
import { Icon, type IconName } from './Icon';

export type BrandMarkVariant = 'circle' | 'tile';

export type BrandMarkProps = {
  readonly testID: string;
  readonly icon?: IconName;
  readonly variant?: BrandMarkVariant;
};

export function BrandMark({ testID, icon = 'aperture', variant = 'circle' }: BrandMarkProps) {
  const { palette } = useTheme();
  const isTile = variant === 'tile';

  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={cn(
        'h-16 w-16 items-center justify-center border',
        isTile ? 'rounded-lg' : 'rounded-full',
      )}
      style={
        isTile
          ? {
              backgroundColor: palette.brand,
              borderColor: palette.brandIcon,
              shadowColor: palette.brand,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }
          : { backgroundColor: palette.brandSoft, borderColor: palette.brand }
      }
    >
      <Icon name={icon} size={34} tone={isTile ? 'inverse' : 'brand'} />
    </View>
  );
}
