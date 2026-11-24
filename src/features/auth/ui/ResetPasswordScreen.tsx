import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { filmLinkApi } from '@/shared/api';
import { firstRouteParam, type RawRouteParam } from '@/shared/lib';
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
import { mapAuthErrorMessage, validateResetPasswordInput } from '../model/auth';

function ResetPasswordHeader({ email }: { readonly email: string }) {
  return (
    <VStack gap="md" align="center" className="w-full">
      <HStack align="center" justify="between" className="w-full">
        <IconButton
          testID="auth.reset.top-back"
          icon="chevron-back"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
        />
        <Badge label="BẢO MẬT TÀI KHOẢN" tone="brand" dot className="self-center" />
        <HStack className="h-11 w-11">{null}</HStack>
      </HStack>

      <VStack gap="sm" align="center">
        <BrandMark testID="auth.reset.brand-mark" variant="tile" />
        <Text variant="title" accessibilityRole="header" className="text-center">
          Tạo mật khẩu mới
        </Text>
        <Text variant="secondary" tone="secondary" className="text-center font-normal">
          Đặt lại mật khẩu cho tài khoản
        </Text>
        <Badge
          testID="auth.reset.recipient"
          label={email}
          tone="surface"
          className="self-center px-3.5 py-1.5"
          icon={<Icon name="mail-outline" size="xs" tone="brand" />}
        />
      </VStack>
    </VStack>
  );
}

export function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: RawRouteParam; resetToken?: RawRouteParam }>();
  const email = firstRouteParam(params.email) ?? 'tài khoản của bạn';
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
    const token = firstRouteParam(params.resetToken);
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
      <VStack gap="lg" className="w-full max-w-sm self-center">
        <ResetPasswordHeader email={email} />

        <Card className="w-full">
          <VStack gap="md">
            {error ? <Alert testID="auth.reset.error" tone="danger" message={error} /> : null}

            <Input
              testID="auth.reset.password"
              label="Mật khẩu mới"
              required
              helperText="(chữ + số, ≥ 8 ký tự)"
              icon={<Icon name="lock-closed-outline" size="sm" tone="muted" />}
              value={newPassword}
              onChangeText={(text) => {
                setError(null);
                setNewPassword(text);
              }}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Tối thiểu 8 ký tự"
            />
            <Input
              testID="auth.reset.confirm"
              label="Xác nhận mật khẩu mới"
              required
              helperText="Nhập lại mật khẩu"
              icon={<Icon name="lock-closed-outline" size="sm" tone="muted" />}
              value={confirmPassword}
              onChangeText={(text) => {
                setError(null);
                setConfirmPassword(text);
              }}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Nhập lại mật khẩu mới"
            />

            <Button
              testID="auth.reset.submit"
              label={loading ? 'Đang lưu mật khẩu...' : 'Xác nhận đổi mật khẩu'}
              variant="primary"
              size="lg"
              elevated
              loading={loading}
              disabled={loading}
              trailingIcon={<Icon name="arrow-forward" size="sm" tone="inverse" />}
              onPress={() => void handleReset()}
            />
          </VStack>
        </Card>

        <HStack gap="xs" justify="center" align="center">
          <Text variant="caption" tone="secondary">
            Đã có tài khoản?
          </Text>
          <Button
            testID="auth.reset.to-login"
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
