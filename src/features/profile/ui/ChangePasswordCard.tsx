import { router } from 'expo-router';
import { useState } from 'react';
import { filmLinkApi, sessionManager } from '@/shared/api';
import { draftStore, setAuthUser } from '@/shared/domain';
import { Button, Card, Input, Text, VStack } from '@/shared/ui';
import { mapChangePasswordErrorMessage, validateChangePasswordForm } from '../model/profile';

export function ChangePasswordCard() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const validationError = validateChangePasswordForm(oldPassword, newPassword, confirmPassword);
    if (validationError) {
      setError(validationError);
      setSuccess(null);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await filmLinkApi.changeMyPassword({ oldPassword, newPassword });
      setSuccess('Đổi mật khẩu thành công. Vui lòng đăng nhập lại với mật khẩu mới.');
      await sessionManager.endSession('signed-out');
      draftStore.reset();
      setAuthUser(null);
      router.replace('/(auth)/login');
    } catch (err) {
      setError(mapChangePasswordErrorMessage(err));
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <VStack gap="md">
        <Text variant="heading">Đổi mật khẩu</Text>
        <Input
          testID="profile.password.old"
          label="Mật khẩu hiện tại"
          value={oldPassword}
          onChangeText={(text) => {
            setError(null);
            setSuccess(null);
            setOldPassword(text);
          }}
          secureTextEntry
          autoCapitalize="none"
        />
        <Input
          testID="profile.password.new"
          label="Mật khẩu mới (>= 8 ký tự, chữ + số)"
          value={newPassword}
          onChangeText={(text) => {
            setError(null);
            setSuccess(null);
            setNewPassword(text);
          }}
          secureTextEntry
          autoCapitalize="none"
        />
        <Input
          testID="profile.password.confirm"
          label="Xác nhận mật khẩu mới"
          value={confirmPassword}
          onChangeText={(text) => {
            setError(null);
            setSuccess(null);
            setConfirmPassword(text);
          }}
          secureTextEntry
          autoCapitalize="none"
        />
        {error ? (
          <Text testID="profile.password.error" variant="caption" tone="danger">
            {error}
          </Text>
        ) : null}
        {success ? (
          <Text testID="profile.password.success" variant="caption" tone="success">
            {success}
          </Text>
        ) : null}
        <Button
          testID="profile.password.submit"
          label={loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          variant="outline"
          disabled={loading}
          onPress={() => void handleSubmit()}
        />
      </VStack>
    </Card>
  );
}
