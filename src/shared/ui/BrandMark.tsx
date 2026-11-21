import { View } from 'react-native';
import { useTheme } from '@/shared/theme';
import { Icon, type IconName } from './Icon';

export type BrandMarkProps = {
  readonly testID: string;
  readonly icon?: IconName;
};

export function BrandMark({ testID, icon = 'aperture' }: BrandMarkProps) {
  const { palette } = useTheme();

  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="h-16 w-16 items-center justify-center rounded-full border"
      style={{ backgroundColor: palette.brandSoft, borderColor: palette.brand }}
    >
      <Icon name={icon} size={34} tone="brand" />
    </View>
  );
}
