import { router } from 'expo-router';
import { useState } from 'react';
import { filmLinkApi } from '@/shared/api';
import { OtpPurpose } from '@/shared/domain';
import { Badge, Button, Card, HStack, Input, Screen, Text, VStack } from '@/shared/ui';
import { mapAuthErrorMessage } from '../model/auth';

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await filmLinkApi.forgotPassword({ email: trimmed });
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { email: trimmed, purpose: OtpPurpose.PASSWORD_RESET },
      });
    } catch (err) {
      setError(mapAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen testID="auth.forgot.screen" scroll centerContent>
      <VStack gap="md" className="w-full max-w-sm self-center">
        <VStack gap="xs" align="center">
          <Badge label="KHÔI PHỤC TÀI KHOẢN" tone="brand" />
          <Text variant="title" accessibilityRole="header" className="text-center">
            Quên mật khẩu
          </Text>
          <Text variant="secondary" tone="muted" className="text-center">
            Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu
          </Text>
        </VStack>

        <Card className="w-full">
          <VStack gap="sm">
            <Input
              testID="auth.forgot.email"
              label="Email đã đăng ký"
              value={email}
              onChangeText={(text) => {
                setError(null);
                setEmail(text);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="name@filmlink.vn"
            />
            {error ? (
              <Text variant="caption" tone="danger">
                {error}
              </Text>
            ) : null}
            <Button
              testID="auth.forgot.submit"
              label={loading ? 'Đang gửi mã...' : 'Gửi mã xác thực OTP'}
              variant="primary"
              disabled={loading}
              onPress={() => void handleSubmit()}
            />
          </VStack>
        </Card>

        <HStack gap="sm" justify="center" align="center">
          <Button
            testID="auth.forgot.back"
            label="Quay lại Đăng nhập"
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
          />
        </HStack>
      </VStack>
    </Screen>
  );
}
