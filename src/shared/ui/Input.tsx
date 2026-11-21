import { type ReactNode, useState } from 'react';
import {
  type KeyboardTypeOptions,
  Pressable,
  TextInput,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { cn } from '@/shared/lib';
import { useTheme } from '@/shared/theme';
import { Icon } from './Icon';
import { Text } from './Text';

export type InputProps = {
  readonly label?: string;
  readonly required?: boolean;
  readonly helperText?: string;
  readonly prefixLabel?: string;
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

function buildTextInputStyle(color: string, multiline: boolean): TextStyle {
  return {
    color,
    fontSize: 14,
    lineHeight: multiline ? 20 : undefined,
    minHeight: multiline ? 80 : 46,
    paddingVertical: multiline ? 6 : 0,
    paddingHorizontal: 0,
    textAlignVertical: multiline ? 'top' : 'center',
    includeFontPadding: false,
  };
}

function buildContainerStyle(
  backgroundColor: string,
  borderColor: string,
  multiline: boolean,
): ViewStyle {
  return {
    backgroundColor,
    borderColor,
    minHeight: multiline ? 96 : 48,
  };
}

function InputLabelRow({
  label,
  required,
  helperText,
}: {
  readonly label?: string;
  readonly required?: boolean;
  readonly helperText?: string;
}) {
  if (!label && !helperText) {
    return null;
  }
  return (
    <View className="flex-row items-baseline justify-between gap-2">
      {label ? (
        <Text variant="caption" tone="default">
          {label}
          {required ? (
            <Text variant="caption" tone="brand">
              {' *'}
            </Text>
          ) : null}
        </Text>
      ) : (
        <View />
      )}
      {helperText ? (
        <Text variant="caption" tone="secondary" className="font-normal">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

function InputPrefix({
  prefixLabel,
  borderColor,
}: {
  readonly prefixLabel?: string;
  readonly borderColor: string;
}) {
  if (!prefixLabel) {
    return null;
  }
  return (
    <View
      className="mr-2.5 flex-row items-center border-r pr-2.5"
      style={{ borderRightColor: borderColor }}
    >
      <Text variant="caption" tone="default">
        {prefixLabel}
      </Text>
    </View>
  );
}

export function Input({
  label,
  required = false,
  helperText,
  prefixLabel,
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
    <View className={cn('gap-2', className)}>
      <InputLabelRow label={label} required={required} helperText={helperText} />
      <View
        className={cn(
          'flex-row rounded border px-3',
          multiline ? 'min-h-24 items-start py-2' : 'min-h-12 items-center',
        )}
        style={buildContainerStyle(palette.surface, borderColor, multiline)}
      >
        {icon ? <View className="mr-2.5">{icon}</View> : null}
        <InputPrefix prefixLabel={prefixLabel} borderColor={palette.borderStrong} />
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
          className="flex-1 min-w-0"
          style={buildTextInputStyle(palette.textPrimary, multiline)}
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
