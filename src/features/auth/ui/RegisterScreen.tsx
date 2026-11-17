import { router } from 'expo-router';
import { useState } from 'react';
import { filmLinkApi } from '@/shared/api';
import { OtpPurpose, validateRegistrationForm } from '@/shared/domain';
import { getFieldErrors } from '@/shared/lib';
import { Badge, Button, Card, HStack, Input, Screen, Text, VStack } from '@/shared/ui';
import { mapAuthErrorMessage } from '../model/auth';

export function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const clearFieldError = (field: string) => {
    setError(null);
    setFieldErrors((prev) => {
      if (!(field in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleRegister = async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phoneNumber.trim();
    const validationError = validateRegistrationForm({
      fullName: trimmedName,
      email: trimmedEmail,
      phoneNumber: trimmedPhone || undefined,
      password,
      acceptedTerms,
    });
    if (validationError) {
      setError(validationError);
      setFieldErrors({});
      return;
    }
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      await filmLinkApi.register({
        email: trimmedEmail,
        password,
        fullName: trimmedName,
        phoneNumber: trimmedPhone || undefined,
        termsAccepted: true,
      });
      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          email: trimmedEmail,
          fullName: trimmedName,
          purpose: OtpPurpose.EMAIL_VERIFICATION,
        },
      });
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(mapAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen testID="auth.register.screen" scroll>
      <VStack gap="lg">
        <VStack gap="xs">
          <Badge label="UC06 · ĐĂNG KÝ PHOTOGRAPHER" tone="brand" />
          <Text variant="title" accessibilityRole="header">
            Tạo tài khoản mới
          </Text>
          <Text variant="secondary" tone="secondary">
            Tài khoản mặc định có vai trò Photographer (BR-01). Sau khi sử dụng bạn có thể nộp hồ sơ
            nâng cấp lên Photography Expert.
          </Text>
        </VStack>

        <Card>
          <VStack gap="md">
            <Input
              testID="auth.register.name"
              label="Họ và tên (2–100 ký tự)"
              value={fullName}
              onChangeText={(text) => {
                clearFieldError('fullName');
                setFullName(text);
              }}
              error={fieldErrors.fullName}
              placeholder="Minh Khôi Analog"
            />
            <Input
              testID="auth.register.email"
              label="Email"
              value={email}
              onChangeText={(text) => {
                clearFieldError('email');
                setEmail(text);
              }}
              error={fieldErrors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="name@filmlink.vn"
            />
            <Input
              testID="auth.register.phone"
              label="Số điện thoại (tùy chọn, 10–12 số)"
              value={phoneNumber}
              onChangeText={(text) => {
                clearFieldError('phoneNumber');
                setPhoneNumber(text);
              }}
              error={fieldErrors.phoneNumber}
              keyboardType="phone-pad"
              placeholder="0908123456"
            />
            <Input
              testID="auth.register.password"
              label="Mật khẩu (chữ + số, >= 8 ký tự)"
              value={password}
              onChangeText={(text) => {
                clearFieldError('password');
                setPassword(text);
              }}
              error={fieldErrors.password}
              secureTextEntry
              autoCapitalize="none"
            />
            <Button
              testID="auth.register.terms"
              label={acceptedTerms ? '✓ Đã đồng ý Điều khoản FilmLink' : 'Chưa đồng ý Điều khoản'}
              variant={acceptedTerms ? 'secondary' : 'outline'}
              size="sm"
              onPress={() => setAcceptedTerms((prev) => !prev)}
            />
            {error ? (
              <Text variant="caption" tone="danger">
                {error}
              </Text>
            ) : null}
            <Button
              testID="auth.register.submit"
              label={loading ? 'Đang tạo tài khoản...' : 'Tiếp tục xác thực OTP'}
              variant="primary"
              disabled={loading}
              onPress={() => void handleRegister()}
            />
          </VStack>
        </Card>

        <HStack gap="sm" justify="center" align="center">
          <Button
            testID="auth.register.back"
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
