import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { filmLinkApi, sessionFromTokenResponse, sessionManager } from '@/shared/api';
import {
  OTP_COOLDOWN_SECONDS,
  OTP_MAX_ATTEMPTS,
  OtpPurpose,
  setAuthUser,
  validateOtpCode,
} from '@/shared/domain';
import { useCountdown } from '@/shared/hooks';
import { Badge, Button, Card, Input, Screen, Text, VStack } from '@/shared/ui';
import {
  mapAuthErrorMessage,
  userAccountFromResponse,
  userAccountFromSession,
} from '../model/auth';

export function VerifyOtpScreen() {
  const params = useLocalSearchParams<{
    email?: string;
    fullName?: string;
    purpose?: OtpPurpose;
  }>();
  const email = params.email ?? 'photographer@filmlink.vn';
  const purpose = params.purpose ?? OtpPurpose.EMAIL_VERIFICATION;
  const isPasswordReset = purpose === OtpPurpose.PASSWORD_RESET;

  const [otp, setOtp] = useState('123456');
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { seconds, restart } = useCountdown(OTP_COOLDOWN_SECONDS);

  const handleVerify = async () => {
    const check = validateOtpCode(otp, attempts, OTP_MAX_ATTEMPTS);
    if (!check.valid) {
      setAttempts(check.nextAttempts);
      setError(check.error);
      return;
    }
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (isPasswordReset) {
        const { resetToken } = await filmLinkApi.verifyPasswordResetOtp({
          email,
          otp: otp.trim(),
        });
        router.push({
          pathname: '/(auth)/reset-password',
          params: { email, resetToken },
        });
      } else {
        const tokens = await filmLinkApi.verifyEmail({ email, otp: otp.trim() });
        const session = sessionFromTokenResponse(tokens);
        if (session) {
          await sessionManager.saveSession(session);
          const profile = await filmLinkApi.getMyAccount().catch(() => null);
          setAuthUser(profile ? userAccountFromResponse(profile) : userAccountFromSession(session));
        }
        router.replace('/(tabs)');
      }
    } catch (err) {
      setAttempts((prev) => prev + 1);
      setError(mapAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setNotice(null);
    try {
      await filmLinkApi.resendOtp({ email, purpose });
      restart(OTP_COOLDOWN_SECONDS);
      setAttempts(0);
      setNotice('Đã gửi lại mã OTP tới email của bạn.');
    } catch (err) {
      setError(mapAuthErrorMessage(err));
    }
  };

  return (
    <Screen testID="auth.otp.screen" scroll>
      <VStack gap="lg">
        <VStack gap="xs">
          <Badge
            label={isPasswordReset ? 'KHÔI PHỤC MẬT KHẨU' : 'UC06 · XÁC THỰC EMAIL'}
            tone="info"
          />
          <Text variant="title" accessibilityRole="header">
            {isPasswordReset ? 'Xác thực đặt lại mật khẩu' : 'Xác thực OTP qua Email'}
          </Text>
          <Text variant="secondary" tone="secondary">
            Mã xác thực 6 chữ số đã gửi tới {email}.
          </Text>
        </VStack>

        <Card>
          <VStack gap="md">
            <Input
              testID="auth.otp.code"
              label="Mã OTP (6 chữ số)"
              value={otp}
              onChangeText={(text) => {
                setError(null);
                setOtp(text);
              }}
              keyboardType="number-pad"
              placeholder="123456"
            />
            {notice ? (
              <Text testID="auth.otp.notice" variant="caption" tone="success">
                {notice}
              </Text>
            ) : null}
            {error ? (
              <Text variant="caption" tone="danger">
                {error}
              </Text>
            ) : null}
            <Button
              testID="auth.otp.verify"
              label={loading ? 'Đang xác thực...' : 'Xác nhận OTP'}
              variant="primary"
              disabled={loading}
              onPress={() => void handleVerify()}
            />
            <Button
              testID="auth.otp.resend"
              label={seconds > 0 ? `Gửi lại mã sau ${seconds}s` : 'Gửi lại mã OTP'}
              variant="outline"
              disabled={seconds > 0 || loading}
              onPress={() => void handleResend()}
            />
          </VStack>
        </Card>
      </VStack>
    </Screen>
  );
}
