import { type KeyboardTypeOptions, TextInput, View } from 'react-native';
import { cn } from '@/shared/lib';
import { useTheme } from '@/shared/theme';
import { Text } from './Text';

export type InputProps = {
  readonly label?: string;
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly placeholder?: string;
  readonly error?: string | null;
  readonly secureTextEntry?: boolean;
  readonly multiline?: boolean;
  readonly keyboardType?: KeyboardTypeOptions;
  readonly autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  readonly testID: string;
  readonly className?: string;
};

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  multiline = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  testID,
  className,
}: InputProps) {
  const { palette } = useTheme();

  return (
    <View className={cn('gap-1.5', className)}>
      {label ? (
        <Text variant="secondary" tone="default">
          {label}
        </Text>
      ) : null}
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.textMuted}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        className={cn('rounded border px-3 py-2.5 text-base', multiline && 'min-h-24')}
        style={{
          backgroundColor: palette.surface,
          borderColor: error ? palette.status.errorText : palette.borderStrong,
          color: palette.textPrimary,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
