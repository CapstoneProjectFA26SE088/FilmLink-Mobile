import { router } from 'expo-router';
import { useState } from 'react';
import { filmLinkApi } from '@/shared/api';
import { OtpPurpose } from '@/shared/domain';
import {
  Alert,
  Badge,
  BrandMark,
  Button,
  Card,
  HStack,
  Icon,
  IconButton,
  Input,
  Screen,
  Text,
  VStack,
} from '@/shared/ui';
import { mapAuthErrorMessage } from '../model/auth';

function ForgotPasswordHeader() {
  return (
    <VStack gap="md" align="center" className="w-full">
      <HStack align="center" justify="between" className="w-full">
        <IconButton
          testID="auth.forgot.top-back"
          icon="chevron-back"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
        />
        <Badge label="KHÔI PHỤC TÀI KHOẢN" tone="brand" dot className="self-center" />
        <HStack className="h-11 w-11">{null}</HStack>
      </HStack>

      <VStack gap="sm" align="center">
        <BrandMark testID="auth.forgot.brand-mark" variant="tile" />
        <Text variant="title" accessibilityRole="header" className="text-center">
          Quên mật khẩu
        </Text>
        <Text variant="secondary" tone="secondary" className="text-center font-normal">
          Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu
        </Text>
      </VStack>
    </VStack>
  );
}

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
      <VStack gap="lg" className="w-full max-w-sm self-center">
        <ForgotPasswordHeader />

        <Card className="w-full">
          <VStack gap="md">
            {error ? <Alert testID="auth.forgot.error" tone="danger" message={error} /> : null}

            <Input
              testID="auth.forgot.email"
              label="Email đã đăng ký"
              required
              helperText="Email nhận mã OTP"
              icon={<Icon name="mail-outline" size="sm" tone="muted" />}
              value={email}
              onChangeText={(text) => {
                setError(null);
                setEmail(text);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="name@filmlink.vn"
            />

            <Button
              testID="auth.forgot.submit"
              label={loading ? 'Đang gửi mã...' : 'Gửi mã xác thực OTP'}
              variant="primary"
              size="lg"
              elevated
              loading={loading}
              disabled={loading}
              trailingIcon={<Icon name="arrow-forward" size="sm" tone="inverse" />}
              onPress={() => void handleSubmit()}
            />
          </VStack>
        </Card>

        <HStack gap="xs" justify="center" align="center">
          <Text variant="caption" tone="secondary">
            Nhớ lại mật khẩu?
          </Text>
          <Button
            testID="auth.forgot.back"
            label="Quay lại Đăng nhập"
            variant="link"
            size="sm"
            underline
            className="px-1"
            onPress={() => router.back()}
          />
        </HStack>
      </VStack>
    </Screen>
  );
}
