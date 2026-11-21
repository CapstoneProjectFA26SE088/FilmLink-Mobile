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
import {
  Alert,
  type AlertTone,
  Badge,
  BrandMark,
  Button,
  Card,
  Divider,
  HStack,
  Icon,
  IconButton,
  OtpCodeInput,
  Screen,
  Text,
  VStack,
} from '@/shared/ui';
import {
  formatCountdownMmSs,
  mapAuthErrorMessage,
  OTP_EXPIRY_SECONDS,
  userAccountFromResponse,
  userAccountFromSession,
} from '../model/auth';

const HELP_NOTICE_MESSAGE =
  'Kiểm tra hộp thư đến hoặc mục Spam/Quảng cáo. Mã OTP gồm 6 chữ số có hiệu lực trong 5 phút.';
const SMS_FALLBACK_NOTICE_MESSAGE =
  'Nhận mã qua tin nhắn SMS sẽ sớm được hỗ trợ. Vui lòng kiểm tra email hoặc nhấn "Gửi lại mã OTP".';

function VerifyOtpHeader({
  isPasswordReset,
  email,
  onHelp,
}: {
  readonly isPasswordReset: boolean;
  readonly email: string;
  readonly onHelp: () => void;
}) {
  return (
    <VStack gap="md" align="center" className="w-full">
      <HStack align="center" justify="between" className="w-full">
        <IconButton
          testID="auth.otp.top-back"
          icon="chevron-back"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
        />
        <Badge
          label={isPasswordReset ? 'KHÔI PHỤC MẬT KHẨU' : 'XÁC THỰC EMAIL'}
          tone="brand"
          dot
          className="self-center"
        />
        <IconButton
          testID="auth.otp.help"
          icon="help-outline"
          accessibilityLabel="Trợ giúp xác thực OTP"
          onPress={onHelp}
        />
      </HStack>

      <VStack gap="sm" align="center">
        <BrandMark testID="auth.otp.brand-mark" variant="tile" />
        <Text variant="title" accessibilityRole="header" className="text-center">
          {isPasswordReset ? 'Xác thực đặt lại mật khẩu' : 'Xác thực OTP qua Email'}
        </Text>
        <Text variant="secondary" tone="secondary" className="text-center font-normal">
          Mã xác thực 6 chữ số đã gửi tới
        </Text>
        <Badge
          testID="auth.otp.recipient"
          label={email}
          tone="surface"
          className="self-center px-3.5 py-1.5"
          icon={<Icon name="mail-outline" size="xs" tone="brand" />}
          trailingIcon={<Icon name="pencil-outline" size="xs" tone="muted" />}
          accessibilityLabel={`Đổi địa chỉ email ${email}`}
          onPress={() => router.back()}
        />
      </VStack>
    </VStack>
  );
}

export function VerifyOtpScreen() {
  const params = useLocalSearchParams<{
    email?: string;
    fullName?: string;
    purpose?: OtpPurpose;
  }>();
  const email = params.email ?? 'photographer@filmlink.vn';
  const purpose = params.purpose ?? OtpPurpose.EMAIL_VERIFICATION;
  const isPasswordReset = purpose === OtpPurpose.PASSWORD_RESET;

  const [otp, setOtp] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<Extract<AlertTone, 'success' | 'info'>>('success');
  const [loading, setLoading] = useState(false);
  const { seconds: resendSeconds, restart: restartResend } = useCountdown(OTP_COOLDOWN_SECONDS);
  const { seconds: expirySeconds, restart: restartExpiry } = useCountdown(OTP_EXPIRY_SECONDS);

  const handleVerify = async () => {
    const check = validateOtpCode(otp, attempts, OTP_MAX_ATTEMPTS);
    if (!check.valid) {
      setAttempts(check.nextAttempts);
      setNotice(null);
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
      restartResend(OTP_COOLDOWN_SECONDS);
      restartExpiry(OTP_EXPIRY_SECONDS);
      setAttempts(0);
      setNoticeTone('success');
      setNotice('Đã gửi lại mã OTP tới email của bạn.');
    } catch (err) {
      setError(mapAuthErrorMessage(err));
    }
  };

  const handleHelp = () => {
    setError(null);
    setNoticeTone('info');
    setNotice(HELP_NOTICE_MESSAGE);
  };

  const handleSmsFallback = () => {
    setError(null);
    setNoticeTone('info');
    setNotice(SMS_FALLBACK_NOTICE_MESSAGE);
  };

  return (
    <Screen testID="auth.otp.screen" scroll centerContent>
      <VStack gap="lg" className="w-full max-w-sm self-center">
        <VerifyOtpHeader isPasswordReset={isPasswordReset} email={email} onHelp={handleHelp} />

        <Card className="w-full">
          <VStack gap="md">
            {error ? <Alert testID="auth.otp.error" tone="danger" message={error} /> : null}
            {notice ? <Alert testID="auth.otp.notice" tone={noticeTone} message={notice} /> : null}

            <HStack align="center" justify="between">
              <Text variant="caption" tone="default">
                Mã OTP (6 chữ số)
              </Text>
              <Badge
                testID="auth.otp.expiry"
                label={formatCountdownMmSs(expirySeconds)}
                tone={expirySeconds > 0 ? 'success' : 'danger'}
                icon={
                  <Icon
                    name="time-outline"
                    size="xs"
                    tone={expirySeconds > 0 ? 'success' : 'danger'}
                  />
                }
              />
            </HStack>

            <OtpCodeInput
              testID="auth.otp.code"
              value={otp}
              error={Boolean(error)}
              onChangeText={(code) => {
                setError(null);
                setOtp(code);
              }}
            />

            <HStack gap="xs" align="center">
              <Icon name="information-circle-outline" size="xs" tone="secondary" />
              <Text variant="caption" tone="secondary" className="flex-1 font-normal">
                Mã bảo mật gồm 6 chữ số có hiệu lực trong 5 phút.
              </Text>
            </HStack>

            <Button
              testID="auth.otp.verify"
              label={loading ? 'Đang xác thực...' : 'Xác nhận OTP'}
              variant="primary"
              size="lg"
              elevated
              loading={loading}
              trailingIcon={<Icon name="arrow-forward" size="sm" tone="inverse" />}
              onPress={() => void handleVerify()}
            />

            <Button
              testID="auth.otp.resend"
              label={
                resendSeconds > 0 ? `Gửi lại mã OTP (sau ${resendSeconds}s)` : 'Gửi lại mã OTP'
              }
              variant="outline"
              size="lg"
              icon={<Icon name="refresh-outline" size="sm" tone="default" />}
              disabled={resendSeconds > 0 || loading}
              onPress={() => void handleResend()}
            />

            <Divider />

            <HStack gap="xs" justify="center" align="center" className="flex-wrap">
              <Text variant="secondary" tone="secondary" className="font-normal">
                Không nhận được email?
              </Text>
              <Button
                testID="auth.otp.sms-fallback"
                label="Nhận mã qua tin nhắn SMS"
                variant="link"
                size="sm"
                underline
                className="px-1"
                onPress={handleSmsFallback}
              />
            </HStack>
          </VStack>
        </Card>

        <HStack gap="xs" justify="center" align="center">
          <Text variant="secondary" tone="secondary" className="font-normal">
            Đã có tài khoản?
          </Text>
          <Button
            testID="auth.otp.to-login"
            label="Quay lại Đăng nhập"
            variant="link"
            size="sm"
            underline
            className="px-1"
            onPress={() => router.replace('/(auth)/login')}
          />
        </HStack>
      </VStack>
    </Screen>
  );
}
