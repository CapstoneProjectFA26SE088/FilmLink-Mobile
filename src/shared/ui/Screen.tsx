import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/shared/lib';
import { useTheme } from '@/shared/theme';

export type ScreenProps = {
  readonly children: ReactNode;
  readonly testID: string;
  readonly scroll?: boolean;
  readonly edges?: 'all' | 'top';
  readonly padded?: boolean;
  readonly header?: ReactNode;
  readonly className?: string;
  readonly centerContent?: boolean;
};

export function Screen({
  children,
  testID,
  scroll = false,
  edges = 'all',
  padded = true,
  header,
  className,
  centerContent = false,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();

  const innerContent = scroll ? (
    <ScrollView
      contentContainerClassName={cn(
        padded && 'px-4 py-4',
        centerContent && 'flex-grow justify-center',
        className,
      )}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: centerContent ? 'center' : undefined,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View className={cn('w-full max-w-lg self-center', centerContent && 'flex-1 justify-center')}>
        {children}
      </View>
    </ScrollView>
  ) : (
    <View
      className={cn(
        'flex-1 w-full max-w-lg self-center',
        padded && 'px-4 py-4',
        centerContent && 'justify-center',
        className,
      )}
    >
      {children}
    </View>
  );

  return (
    <View
      testID={testID}
      className="flex-1"
      style={{
        backgroundColor: palette.background,
        paddingTop: insets.top,
        paddingBottom: edges === 'all' ? insets.bottom : 0,
      }}
    >
      {header}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {innerContent}
      </KeyboardAvoidingView>
    </View>
  );
}
