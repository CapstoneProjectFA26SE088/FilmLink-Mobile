import { type ComponentRef, useRef, useState } from 'react';
import { TextInput, type TextStyle, View, type ViewStyle } from 'react-native';
import { cn } from '@/shared/lib';
import { type ThemePalette, useTheme } from '@/shared/theme';

export type OtpCodeInputProps = {
  readonly value: string;
  readonly onChangeText: (code: string) => void;
  readonly testID: string;
  readonly length?: number;
  readonly error?: boolean;
  readonly className?: string;
};

export type OtpEditResult = {
  readonly nextValue: string;
  readonly nextFocus: number;
};

export function parseOtpSlots(value: string, length = 6): readonly string[] {
  return Array.from({ length }, (_, idx) => {
    const ch = value[idx];
    return ch && ch !== ' ' ? ch : '';
  });
}

function serializeOtpSlots(slots: readonly string[]): string {
  return slots
    .map((slot) => slot || ' ')
    .join('')
    .trimEnd();
}

function pickSingleOverwriteDigit(digits: string, existing: string): string {
  if (digits[0] === existing) {
    return digits[1] ?? digits[0];
  }
  return digits[0] ?? '';
}

function applyMultiDigitPaste(
  next: string[],
  index: number,
  digits: string,
  existing: string,
  length: number,
): OtpEditResult {
  if (digits.length >= length) {
    const startOffset =
      existing && digits.length === length + 1 && digits.startsWith(existing) ? 1 : 0;
    const clipped = digits.slice(startOffset, startOffset + length);
    for (let i = 0; i < length; i += 1) {
      next[i] = clipped[i] ?? '';
    }
    return { nextValue: serializeOtpSlots(next), nextFocus: length - 1 };
  }
  if (index === 0) {
    next.fill('');
  }
  for (let offset = 0; offset < digits.length && index + offset < length; offset += 1) {
    next[index + offset] = digits[offset] ?? '';
  }
  return {
    nextValue: serializeOtpSlots(next),
    nextFocus: Math.min(length - 1, index + digits.length),
  };
}

export function applyOtpBoxChange(
  currentSlots: readonly string[],
  index: number,
  rawText: string,
  length = 6,
): OtpEditResult {
  const next = Array.from({ length }, (_, i) => currentSlots[i] ?? '');
  if (rawText.length === 0) {
    next[index] = '';
    return {
      nextValue: serializeOtpSlots(next),
      nextFocus: index > 0 ? index - 1 : 0,
    };
  }
  const digits = rawText.replace(/\D/g, '');
  if (digits.length === 0) {
    next[index] = '';
    return { nextValue: serializeOtpSlots(next), nextFocus: index };
  }
  const existing = next[index] ?? '';
  if (digits.length === 1) {
    next[index] = digits;
    return {
      nextValue: serializeOtpSlots(next),
      nextFocus: Math.min(length - 1, index + 1),
    };
  }
  if (digits.length === 2 && existing && (digits[0] === existing || digits[1] === existing)) {
    next[index] = pickSingleOverwriteDigit(digits, existing);
    return {
      nextValue: serializeOtpSlots(next),
      nextFocus: Math.min(length - 1, index + 1),
    };
  }
  return applyMultiDigitPaste(next, index, digits, existing, length);
}

export function applyOtpBackspace(currentSlots: readonly string[], index: number): OtpEditResult {
  const existing = currentSlots[index] ?? '';
  if (!existing && index > 0) {
    const next = [...currentSlots];
    next[index - 1] = '';
    return { nextValue: serializeOtpSlots(next), nextFocus: index - 1 };
  }
  return { nextValue: serializeOtpSlots(currentSlots), nextFocus: index };
}

function buildBoxContainerStyle(
  palette: ThemePalette,
  hasError: boolean,
  isFocused: boolean,
  isFilled: boolean,
): ViewStyle {
  const borderColor = hasError
    ? palette.status.errorText
    : isFocused
      ? palette.brand
      : isFilled
        ? palette.borderStrong
        : palette.border;
  const backgroundColor = isFocused ? palette.brandSoft : palette.surface;
  return {
    minHeight: 56,
    maxWidth: 48,
    backgroundColor,
    borderColor,
  };
}

function buildDigitTextStyle(color: string): TextStyle {
  return {
    color,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    minHeight: 54,
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  };
}

export function OtpCodeInput({
  value,
  onChangeText,
  testID,
  length = 6,
  error = false,
  className,
}: OtpCodeInputProps) {
  const { palette } = useTheme();
  const inputRefs = useRef<Array<ComponentRef<typeof TextInput> | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const slots = parseOtpSlots(value, length);

  const handleBoxChange = (idx: number, text: string) => {
    const { nextValue, nextFocus } = applyOtpBoxChange(slots, idx, text, length);
    onChangeText(nextValue);
    if (nextFocus !== idx) {
      inputRefs.current[nextFocus]?.focus();
    }
  };

  const handleBoxKeyPress = (idx: number, key: string) => {
    if (key !== 'Backspace') {
      return;
    }
    const { nextValue, nextFocus } = applyOtpBackspace(slots, idx);
    if (nextFocus !== idx) {
      onChangeText(nextValue);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  const positions = Array.from({ length }, (_, i) => i);

  return (
    <View className={cn('flex-row items-center justify-between gap-2', className)}>
      {positions.map((pos) => {
        const digit = slots[pos] ?? '';
        return (
          <View
            key={`otp-pos-${pos}`}
            className="flex-1 items-center justify-center rounded border"
            style={buildBoxContainerStyle(palette, error, focusedIndex === pos, digit.length > 0)}
          >
            <TextInput
              ref={(node) => {
                inputRefs.current[pos] = node;
              }}
              testID={pos === 0 ? testID : `${testID}.${pos}`}
              accessibilityLabel={`Chữ số OTP thứ ${pos + 1}`}
              value={digit}
              onChangeText={(text) => handleBoxChange(pos, text)}
              onKeyPress={({ nativeEvent }) => handleBoxKeyPress(pos, nativeEvent.key)}
              onFocus={() => setFocusedIndex(pos)}
              onBlur={() => setFocusedIndex((prev) => (prev === pos ? null : prev))}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              selectTextOnFocus
              className="w-full"
              style={buildDigitTextStyle(palette.textPrimary)}
            />
          </View>
        );
      })}
    </View>
  );
}
