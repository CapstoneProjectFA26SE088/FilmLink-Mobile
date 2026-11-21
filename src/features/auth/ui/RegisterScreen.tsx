import { router } from 'expo-router';
import { useState } from 'react';
import { filmLinkApi } from '@/shared/api';
import { OtpPurpose, validateRegistrationForm } from '@/shared/domain';
import { getFieldErrors } from '@/shared/lib';
import {
  Alert,
  BrandMark,
  Button,
  Card,
  Checkbox,
  Divider,
  HStack,
  Icon,
  IconButton,
  Input,
  Screen,
  Text,
  VStack,
} from '@/shared/ui';
import { mapAuthErrorMessage } from '../model/auth';

const SOCIAL_REGISTER_NOTICE: Record<'google' | 'apple', string> = {
  google: 'Đăng ký nhanh bằng Google sẽ sớm được hỗ trợ. Vui lòng tạo tài khoản bằng email.',
  apple: 'Đăng ký nhanh bằng Apple sẽ sớm được hỗ trợ. Vui lòng tạo tài khoản bằng email.',
};

function RegisterBrandHeader() {
  return (
    <VStack gap="md" align="center" className="w-full">
      <HStack align="center" justify="between" className="w-full">
        <IconButton
          testID="auth.register.top-back"
          icon="chevron-back"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
        />
        <HStack className="h-11 w-11">{null}</HStack>
      </HStack>

      <VStack gap="sm" align="center">
        <BrandMark testID="auth.register.brand-mark" variant="tile" />
        <Text variant="title" accessibilityRole="header" className="text-center">
          Tạo tài khoản mới
        </Text>
        <Text variant="secondary" tone="secondary" className="text-center font-normal">
          {'Tham gia cộng đồng và dịch vụ tráng ảnh '}
          <Text variant="secondary" tone="link" className="font-semibold">
            FilmLink
          </Text>
        </Text>
      </VStack>
    </VStack>
  );
}

export function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const clearFeedback = () => {
    setError(null);
    setNotice(null);
  };

  const clearFieldError = (field: string) => {
    clearFeedback();
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
    const normalizedPhone = phoneNumber.replace(/\s+/g, '');
    setNotice(null);
    const validationError = validateRegistrationForm({
      fullName: trimmedName,
      email: trimmedEmail,
      phoneNumber: normalizedPhone || undefined,
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
        phoneNumber: normalizedPhone || undefined,
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

  const handleSocialRegister = (provider: 'google' | 'apple') => {
    setError(null);
    setNotice(SOCIAL_REGISTER_NOTICE[provider]);
  };

  return (
    <Screen testID="auth.register.screen" scroll centerContent>
      <VStack gap="lg" className="w-full max-w-sm self-center">
        <RegisterBrandHeader />

        <Card className="w-full">
          <VStack gap="md">
            {error ? <Alert testID="auth.register.error" tone="danger" message={error} /> : null}
            {notice ? <Alert testID="auth.register.notice" tone="info" message={notice} /> : null}

            <Input
              testID="auth.register.name"
              label="Họ và tên"
              required
              helperText="(2–100 ký tự)"
              value={fullName}
              onChangeText={(text) => {
                clearFieldError('fullName');
                setFullName(text);
              }}
              error={fieldErrors.fullName}
              placeholder="Minh Khôi Analog"
              icon={<Icon name="person-outline" size="sm" tone="secondary" />}
            />
            <Input
              testID="auth.register.email"
              label="Email"
              required
              helperText="Dùng nhận ảnh tráng scan"
              value={email}
              onChangeText={(text) => {
                clearFieldError('email');
                setEmail(text);
              }}
              error={fieldErrors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="name@filmlink.vn"
              icon={<Icon name="mail-outline" size="sm" tone="secondary" />}
            />
            <Input
              testID="auth.register.phone"
              label="Số điện thoại"
              helperText="(tùy chọn, 10–12 số)"
              prefixLabel="VN +84"
              value={phoneNumber}
              onChangeText={(text) => {
                clearFieldError('phoneNumber');
                setPhoneNumber(text);
              }}
              error={fieldErrors.phoneNumber}
              keyboardType="phone-pad"
              placeholder="0908 123 456"
            />
            <Input
              testID="auth.register.password"
              label="Mật khẩu"
              required
              helperText="(chữ + số, ≥ 8 ký tự)"
              value={password}
              onChangeText={(text) => {
                clearFieldError('password');
                setPassword(text);
              }}
              error={fieldErrors.password}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Tối thiểu 8 ký tự"
              icon={<Icon name="lock-closed-outline" size="sm" tone="secondary" />}
            />

            <Checkbox
              testID="auth.register.terms"
              checked={acceptedTerms}
              onToggle={() => {
                clearFeedback();
                setAcceptedTerms((prev) => !prev);
              }}
              accessibilityLabel="Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của FilmLink"
            >
              <Text variant="secondary" tone="secondary" className="font-normal leading-5">
                {'Tôi đồng ý với '}
                <Text variant="secondary" tone="link" className="underline">
                  Điều khoản dịch vụ
                </Text>
                {' và '}
                <Text variant="secondary" tone="link" className="underline">
                  Chính sách bảo mật
                </Text>
                {' của FilmLink'}
              </Text>
            </Checkbox>

            <Button
              testID="auth.register.submit"
              label={loading ? 'Đang tạo tài khoản...' : 'Tiếp tục xác thực OTP'}
              variant="primary"
              size="lg"
              elevated
              loading={loading}
              trailingIcon={<Icon name="arrow-forward" size="sm" tone="inverse" />}
              onPress={() => void handleRegister()}
            />

            <Divider label="HOẶC ĐĂNG KÝ NHANH" />

            <HStack gap="sm">
              <Button
                testID="auth.register.google"
                label="Google"
                variant="outline"
                size="lg"
                className="flex-1"
                icon={<Icon name="logo-google" size="sm" tone="default" />}
                onPress={() => handleSocialRegister('google')}
              />
              <Button
                testID="auth.register.apple"
                label="Apple"
                variant="outline"
                size="lg"
                className="flex-1"
                icon={<Icon name="logo-apple" size="sm" tone="default" />}
                onPress={() => handleSocialRegister('apple')}
              />
            </HStack>
          </VStack>
        </Card>

        <HStack gap="xs" justify="center" align="center">
          <Text variant="secondary" tone="secondary" className="font-normal">
            Đã có tài khoản?
          </Text>
          <Button
            testID="auth.register.back"
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
