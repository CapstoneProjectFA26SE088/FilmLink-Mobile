import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { filmLinkApi } from '@/shared/api';
import { Badge, Button, Card, Input, Screen, Text, VStack } from '@/shared/ui';
import { mapAuthErrorMessage, validateResetPasswordInput } from '../model/auth';

export function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string; resetToken?: string }>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    const validationError = validateResetPasswordInput(newPassword, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }
    const token = params.resetToken;
    if (!token) {
      setError('Mã xác thực đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await filmLinkApi.resetPassword({ resetToken: token, newPassword });
      router.replace('/(auth)/login');
    } catch (err) {
      setError(mapAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen testID="auth.reset.screen" scroll centerContent>
      <VStack gap="md" className="w-full max-w-sm self-center">
        <VStack gap="xs" align="center">
          <Badge label="BẢO MẬT TÀI KHOẢN" tone="brand" />
          <Text variant="title" accessibilityRole="header" className="text-center">
            Tạo mật khẩu mới
          </Text>
          <Text variant="secondary" tone="muted" className="text-center">
            Đặt lại mật khẩu cho tài khoản {params.email ?? 'của bạn'}.
          </Text>
        </VStack>

        <Card className="w-full">
          <VStack gap="sm">
            <Input
              testID="auth.reset.password"
              label="Mật khẩu mới (>= 8 ký tự, chữ + số)"
              value={newPassword}
              onChangeText={(text) => {
                setError(null);
                setNewPassword(text);
              }}
              secureTextEntry
              autoCapitalize="none"
            />
            <Input
              testID="auth.reset.confirm"
              label="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChangeText={(text) => {
                setError(null);
                setConfirmPassword(text);
              }}
              secureTextEntry
              autoCapitalize="none"
            />
            {error ? (
              <Text variant="caption" tone="danger">
                {error}
              </Text>
            ) : null}
            <Button
              testID="auth.reset.submit"
              label={loading ? 'Đang lưu mật khẩu...' : 'Xác nhận đổi mật khẩu'}
              variant="primary"
              disabled={loading}
              onPress={() => void handleReset()}
            />
          </VStack>
        </Card>
      </VStack>
    </Screen>
  );
}
