import type { AuthSession, UserAccountResponse } from '@/shared/api';
import {
  AccountStatus,
  ErrorCode,
  Role,
  type UserAccount,
  validatePasswordComplexity,
} from '@/shared/domain';
import { getErrorMessage, hasErrorCode, isNetworkError } from '@/shared/lib';

export const OTP_EXPIRY_SECONDS = 300;

export function formatCountdownMmSs(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(safe / 60)).padStart(2, '0');
  const ss = String(safe % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function resolveLoginRole(email: string, selectedRole?: Role): Role {
  if (selectedRole) {
    return selectedRole;
  }
  return email.toLowerCase().includes('expert') ? Role.PHOTOGRAPHY_EXPERT : Role.PHOTOGRAPHER;
}

export function userAccountFromResponse(res: UserAccountResponse): UserAccount {
  return {
    id: String(res.id),
    email: res.email,
    fullName: res.fullName,
    phoneNumber: res.phoneNumber ?? undefined,
    role: res.role,
    status: res.status,
    joinedAt: res.createdAt,
  };
}

export function userAccountFromSession(session: AuthSession): UserAccount {
  return {
    id: String(session.accountId),
    email: session.email,
    fullName: session.email,
    role: session.role,
    status: AccountStatus.ACTIVE,
    joinedAt: session.accessTokenExpiresAt,
  };
}

export function validateResetPasswordInput(
  newPassword: string,
  confirmPassword: string,
): string | null {
  if (newPassword !== confirmPassword) {
    return 'Mật khẩu xác nhận không khớp với mật khẩu mới.';
  }
  return validatePasswordComplexity(newPassword);
}

export function mapAuthErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Không thể kết nối tới máy chủ FilmLink. Vui lòng kiểm tra mạng.';
  }
  if (hasErrorCode(error, ErrorCode.ACCOUNT_INVALID_CREDENTIALS)) {
    return 'Email hoặc mật khẩu không chính xác (MSG09).';
  }
  if (hasErrorCode(error, ErrorCode.ACCOUNT_NOT_VERIFIED)) {
    return 'Tài khoản chưa được kích hoạt qua mã OTP.';
  }
  if (hasErrorCode(error, ErrorCode.ACCOUNT_LOCKED)) {
    return 'Tài khoản của bạn đã bị khóa bởi Quản trị viên.';
  }
  if (hasErrorCode(error, ErrorCode.ACCOUNT_TEMPORARILY_LOCKED)) {
    return 'Tài khoản bị tạm khóa 15 phút do nhập sai quá 5 lần (MSG10).';
  }
  if (hasErrorCode(error, ErrorCode.ACCOUNT_EMAIL_ALREADY_EXISTS)) {
    return 'Địa chỉ email này đã được sử dụng. Vui lòng chọn email khác.';
  }
  if (hasErrorCode(error, ErrorCode.ACCOUNT_REGISTRATION_REJECTED)) {
    return 'Đăng ký tài khoản không thành công. Vui lòng kiểm tra lại.';
  }
  if (hasErrorCode(error, ErrorCode.ACCOUNT_OTP_INVALID)) {
    return 'Mã OTP không chính xác, đã hết hạn hoặc quá số lần thử (MSG11).';
  }
  if (hasErrorCode(error, ErrorCode.ACCOUNT_OTP_RESEND_TOO_FAST)) {
    return 'Vui lòng đợi 60 giây giữa các lần gửi lại mã OTP (MSG12).';
  }
  if (hasErrorCode(error, ErrorCode.ACCOUNT_OTP_RESEND_LIMIT_EXCEEDED)) {
    return 'Đã vượt quá giới hạn 3 lần gửi lại mã trong 15 phút (MSG12).';
  }
  if (hasErrorCode(error, ErrorCode.ACCOUNT_OLD_PASSWORD_INVALID)) {
    return 'Mật khẩu hiện tại không chính xác.';
  }
  if (hasErrorCode(error, ErrorCode.ACCOUNT_NEW_PASSWORD_SAME_AS_OLD)) {
    return 'Mật khẩu mới không được trùng với mật khẩu cũ.';
  }
  return getErrorMessage(error);
}
