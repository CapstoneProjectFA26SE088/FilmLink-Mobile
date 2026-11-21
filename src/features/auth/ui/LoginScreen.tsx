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
import {
  Alert,
  BrandMark,
  Button,
  Card,
  Divider,
  HStack,
  Icon,
  Input,
  Screen,
  Text,
  VStack,
} from '@/shared/ui';
import {
  mapAuthErrorMessage,
  userAccountFromResponse,
  userAccountFromSession,
} from '../model/auth';

const SOCIAL_PENDING_NOTICE: Record<'google' | 'apple', string> = {
  google: 'Đăng nhập bằng Google sẽ sớm được hỗ trợ. Vui lòng dùng email và mật khẩu.',
  apple: 'Đăng nhập bằng Apple sẽ sớm được hỗ trợ. Vui lòng dùng email và mật khẩu.',
};

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
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const { seconds: lockSeconds, restart: restartLockCountdown } = useCountdown(0);

  const clearFeedback = () => {
    setError(null);
    setNotice(null);
  };

  const handleLiveLogin = async () => {
    const trimmedEmail = email.trim();
    const validationError = validateLoginCredentials(trimmedEmail, password);
    setNotice(null);
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

  const handleSocialLogin = (provider: 'google' | 'apple') => {
    setError(null);
    setNotice(SOCIAL_PENDING_NOTICE[provider]);
  };

  return (
    <Screen testID="auth.login.screen" scroll centerContent>
      <VStack gap="lg" className="w-full max-w-sm self-center">
        <VStack gap="sm" align="center">
          <BrandMark testID="auth.login.brand-mark" />
          <Text variant="caption" tone="link" className="mt-1 tracking-widest">
            FILMLINK ANALOG
          </Text>
          <Text variant="title" accessibilityRole="header" className="text-center">
            Đăng nhập tài khoản
          </Text>
          <Text variant="secondary" tone="secondary" className="text-center font-normal">
            Kết nối cộng đồng chụp phim, tráng scan và chuyên gia
          </Text>
        </VStack>

        <Card className="w-full">
          <VStack gap="md">
            {error ? (
              <Alert testID="auth.login.error" tone="danger">
                {error}
              </Alert>
            ) : null}
            {lockSeconds > 0 ? (
              <Alert
                testID="auth.login.lock-countdown"
                tone="warning"
                message={`Tài khoản bị khóa: ${Math.floor(lockSeconds / 60)} phút ${lockSeconds % 60} giây`}
              />
            ) : null}
            {notice ? (
              <Alert testID="auth.login.notice" tone="info">
                {notice}
              </Alert>
            ) : null}
            {unverifiedEmail ? (
              <Button
                testID="auth.login.unverified-prompt"
                label="Tài khoản chưa xác thực. Nhấn để nhập mã OTP"
                variant="outline"
                onPress={() =>
                  router.push({
                    pathname: '/(auth)/verify-otp',
                    params: { email: unverifiedEmail, purpose: OtpPurpose.EMAIL_VERIFICATION },
                  })
                }
              />
            ) : null}

            <Input
              testID="auth.login.email"
              label="Email"
              value={email}
              onChangeText={(text) => {
                clearFeedback();
                setUnverifiedEmail(null);
                setEmail(text);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="vidu@email.com"
              icon={<Icon name="at" size="sm" tone="secondary" />}
            />
            <VStack gap="xs">
              <Input
                testID="auth.login.password"
                label="Mật khẩu"
                value={password}
                onChangeText={(text) => {
                  clearFeedback();
                  setPassword(text);
                }}
                secureTextEntry
                autoCapitalize="none"
                placeholder="Tối thiểu 8 ký tự"
                icon={<Icon name="lock-closed-outline" size="sm" tone="secondary" />}
              />
              <HStack justify="end">
                <Button
                  testID="auth.login.forgot-password"
                  label="Quên mật khẩu?"
                  variant="link"
                  size="sm"
                  className="px-1"
                  onPress={() => router.push('/(auth)/forgot-password')}
                />
              </HStack>
            </VStack>

            <Button
              testID="auth.login.submit"
              label={loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              variant="primary"
              size="lg"
              loading={loading}
              disabled={lockSeconds > 0}
              onPress={() => void handleLiveLogin()}
            />

            <Divider label="HOẶC ĐĂNG NHẬP BẰNG" />

            <HStack gap="sm">
              <Button
                testID="auth.login.google"
                label="Google"
                variant="outline"
                size="lg"
                className="flex-1"
                icon={<Icon name="logo-google" size="sm" tone="default" />}
                onPress={() => handleSocialLogin('google')}
              />
              <Button
                testID="auth.login.apple"
                label="Apple"
                variant="outline"
                size="lg"
                className="flex-1"
                icon={<Icon name="logo-apple" size="sm" tone="default" />}
                onPress={() => handleSocialLogin('apple')}
              />
            </HStack>
          </VStack>
        </Card>

        <HStack gap="xs" align="center" justify="center">
          <Text variant="secondary" tone="secondary" className="font-normal">
            Chưa có tài khoản?
          </Text>
          <Button
            testID="auth.login.to-register"
            label="Đăng ký tài khoản mới"
            variant="link"
            size="sm"
            className="px-1"
            onPress={() => router.push('/(auth)/register')}
          />
        </HStack>
      </VStack>
    </Screen>
  );
}
