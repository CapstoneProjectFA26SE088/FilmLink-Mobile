import { router } from 'expo-router';
import { useState } from 'react';
import {
  decodeAccessTokenClaims,
  filmLinkApi,
  isSupportedMobileRole,
  sessionFromTokenResponse,
  sessionManager,
  type TokenResponse,
} from '@/shared/api';
import { ErrorCode, OtpPurpose, setAuthUser, validateLoginCredentials } from '@/shared/domain';
import { useCountdown } from '@/shared/hooks';
import { hasErrorCode } from '@/shared/lib';
import { Badge, Button, Card, HStack, Input, Screen, Text, VStack } from '@/shared/ui';
import {
  mapAuthErrorMessage,
  userAccountFromResponse,
  userAccountFromSession,
} from '../model/auth';

async function persistLoginSession(tokens: TokenResponse): Promise<string | null> {
  const claims = decodeAccessTokenClaims(tokens.accessToken);
  if (!claims || !isSupportedMobileRole(claims.role)) {
    return 'Ứng dụng di động FilmLink chỉ hỗ trợ tài khoản Nhiếp ảnh gia và Chuyên gia. Vui lòng đăng nhập trên giao diện Web quản trị.';
  }
  const session = sessionFromTokenResponse(tokens);
  if (!session) {
    return 'Không thể khởi tạo phiên đăng nhập. Vui lòng thử lại.';
  }
  await sessionManager.saveSession(session);
  const profile = await filmLinkApi.getMyAccount().catch(() => null);
  setAuthUser(profile ? userAccountFromResponse(profile) : userAccountFromSession(session));
  return null;
}

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const { seconds: lockSeconds, restart: restartLockCountdown } = useCountdown(0);

  const handleLiveLogin = async () => {
    const trimmedEmail = email.trim();
    const validationError = validateLoginCredentials(trimmedEmail, password);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (lockSeconds > 0) {
      setError(`Tài khoản tạm thời bị khóa. Vui lòng thử lại sau ${lockSeconds} giây.`);
      return;
    }
    setError(null);
    setUnverifiedEmail(null);
    setLoading(true);
    try {
      const tokens = await filmLinkApi.login({ email: trimmedEmail, password });
      const sessionError = await persistLoginSession(tokens);
      if (sessionError) {
        setError(sessionError);
        return;
      }
      router.replace('/(tabs)');
    } catch (err) {
      if (hasErrorCode(err, ErrorCode.ACCOUNT_NOT_VERIFIED)) {
        setUnverifiedEmail(trimmedEmail);
      }
      if (hasErrorCode(err, ErrorCode.ACCOUNT_TEMPORARILY_LOCKED)) {
        restartLockCountdown(900);
      }
      setError(mapAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen testID="auth.login.screen" scroll>
      <VStack gap="lg">
        <VStack gap="xs">
          <Badge label="FILMLINK ANALOG PLATFORM" tone="brand" />
          <Text variant="title" accessibilityRole="header">
            Đăng nhập tài khoản
          </Text>
          <Text variant="secondary" tone="secondary">
            Kết nối cộng đồng chụp phim, đặt dịch vụ tráng scan và chia sẻ kiến thức chuyên gia.
          </Text>
        </VStack>

        <Card>
          <VStack gap="md">
            <Input
              testID="auth.login.email"
              label="Email"
              value={email}
              onChangeText={(text) => {
                setError(null);
                setUnverifiedEmail(null);
                setEmail(text);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="photographer@filmlink.vn"
            />
            <Input
              testID="auth.login.password"
              label="Mật khẩu"
              value={password}
              onChangeText={(text) => {
                setError(null);
                setPassword(text);
              }}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Tối thiểu 8 ký tự"
            />
            {error ? (
              <Text variant="caption" tone="danger">
                {error}
              </Text>
            ) : null}
            {lockSeconds > 0 ? (
              <Text testID="auth.login.lock-countdown" variant="caption" tone="warning">
                Tài khoản bị khóa: {Math.floor(lockSeconds / 60)} phút {lockSeconds % 60} giây
              </Text>
            ) : null}
            {unverifiedEmail ? (
              <Button
                testID="auth.login.unverified-prompt"
                label="Tài khoản chưa xác thực OTP. Nhấn để kích hoạt ngay"
                variant="outline"
                size="sm"
                onPress={() =>
                  router.push({
                    pathname: '/(auth)/verify-otp',
                    params: { email: unverifiedEmail, purpose: OtpPurpose.EMAIL_VERIFICATION },
                  })
                }
              />
            ) : null}
            <Button
              testID="auth.login.submit"
              label={loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              variant="primary"
              disabled={loading || lockSeconds > 0}
              onPress={() => void handleLiveLogin()}
            />
            <HStack justify="end">
              <Button
                testID="auth.login.forgot-password"
                label="Quên mật khẩu?"
                variant="ghost"
                size="sm"
                onPress={() => router.push('/(auth)/forgot-password')}
              />
            </HStack>
          </VStack>
        </Card>

        <HStack gap="sm" align="center" justify="center">
          <Text variant="secondary" tone="secondary">
            Chưa có tài khoản?
          </Text>
          <Button
            testID="auth.login.to-register"
            label="Đăng ký ngay (UC06)"
            variant="ghost"
            size="sm"
            onPress={() => router.push('/(auth)/register')}
          />
        </HStack>
      </VStack>
    </Screen>
  );
}
