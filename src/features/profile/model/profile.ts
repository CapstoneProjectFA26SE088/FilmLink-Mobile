import { ErrorCode, validateChangePasswordInput } from '@/shared/domain';
import { getErrorMessage, hasErrorCode, isNetworkError } from '@/shared/lib';
import type { ThemePreference } from '@/shared/theme';

export const THEME_OPTIONS: readonly { readonly value: ThemePreference; readonly label: string }[] =
  [
    { value: 'system', label: 'Hệ thống' },
    { value: 'light', label: 'Sáng (Light)' },
    { value: 'dark', label: 'Tối (Dark)' },
  ];

export function describeThemeOption(preference: ThemePreference): string {
  switch (preference) {
    case 'system':
      return 'Theo cài đặt thiết bị (System)';
    case 'light':
      return 'Chế độ Sáng (Light)';
    case 'dark':
      return 'Chế độ Tối (Dark)';
  }
}

export function validateChangePasswordForm(
  oldPass: string,
  newPass: string,
  confirmPass: string,
): string | null {
  if (newPass !== confirmPass) {
    return 'Mật khẩu xác nhận không khớp với mật khẩu mới.';
  }
  return validateChangePasswordInput(oldPass, newPass);
}

export function mapChangePasswordErrorMessage(error: unknown): string {
  if (hasErrorCode(error, ErrorCode.ACCOUNT_OLD_PASSWORD_INVALID)) {
    return 'Mật khẩu hiện tại không chính xác.';
  }
  if (hasErrorCode(error, ErrorCode.ACCOUNT_NEW_PASSWORD_SAME_AS_OLD)) {
    return 'Mật khẩu mới phải khác mật khẩu hiện tại.';
  }
  if (isNetworkError(error)) {
    return 'Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.';
  }
  return getErrorMessage(error);
}
