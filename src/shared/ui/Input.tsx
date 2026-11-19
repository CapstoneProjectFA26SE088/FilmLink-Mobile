import { type ReactNode, useState } from 'react';
import { type KeyboardTypeOptions, Pressable, TextInput, View } from 'react-native';
import { cn } from '@/shared/lib';
import { useTheme } from '@/shared/theme';
import { Icon } from './Icon';
import { Text } from './Text';

export type InputProps = {
  readonly label?: string;
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly placeholder?: string;
  readonly error?: string | null;
  readonly secureTextEntry?: boolean;
  readonly multiline?: boolean;
  readonly icon?: ReactNode;
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
  icon,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  testID,
  className,
}: InputProps) {
  const { palette } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);

  const isPassword = secureTextEntry;
  const isHidden = isPassword && !showPassword;

  const borderColor = error ? palette.status.errorText : isFocused ? palette.brand : palette.border;

  return (
    <View className={cn('gap-1', className)}>
      {label ? (
        <Text variant="caption" tone="secondary">
          {label}
        </Text>
      ) : null}
      <View
        className={cn(
          'flex-row items-center rounded-xl border px-3',
          multiline ? 'min-h-20 py-2.5 items-start' : 'min-h-11 h-11 py-1.5',
        )}
        style={{
          backgroundColor: palette.surface,
          borderColor,
        }}
      >
        {icon ? <View className="mr-2">{icon}</View> : null}
        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.textMuted}
          secureTextEntry={isHidden}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 text-sm"
          style={{
            color: palette.textPrimary,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
        />
        {isPassword ? (
          <Pressable
            testID={`${testID}.toggle-password`}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={8}
            className="ml-1.5 p-1"
          >
            <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size="sm" tone="muted" />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
