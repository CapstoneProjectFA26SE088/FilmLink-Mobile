import { Role } from '../enums';
import {
  EMAIL_REGEX,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  OTP_MAX_ATTEMPTS_DEFAULT,
  PASSWORD_COMPLEXITY_REGEX,
  VN_PHONE_REGEX,
} from './constants';

export type RegistrationValidationInput = {
  readonly fullName: string;
  readonly email: string;
  readonly password: string;
  readonly phoneNumber?: string | null;
  readonly acceptedTerms: boolean;
};

export function validateLoginCredentials(email: string, password: string): string | null {
  if (
    !email.trim() ||
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    return 'Email hoặc mật khẩu không hợp lệ (MSG09). Mật khẩu từ 8 đến 72 ký tự.';
  }
  return null;
}

export function validatePhoneNumber(phone: string, required = false): string | null {
  const trimmed = phone.trim();
  if (!trimmed) {
    return required ? 'Vui lòng nhập số điện thoại liên hệ.' : null;
  }
  if (!VN_PHONE_REGEX.test(trimmed)) {
    return 'Số điện thoại Việt Nam cần bắt đầu bằng 0 hoặc +84 và gồm 10 đến 12 chữ số.';
  }
  return null;
}

export function validatePasswordComplexity(password: string): string | null {
  if (!PASSWORD_COMPLEXITY_REGEX.test(password)) {
    return 'Mật khẩu phải từ 8 đến 72 ký tự, bao gồm cả chữ và số (UC06).';
  }
  return null;
}

export function validateChangePasswordInput(
  oldPassword: string,
  newPassword: string,
): string | null {
  if (!oldPassword || oldPassword.length > MAX_PASSWORD_LENGTH) {
    return 'Vui lòng nhập mật khẩu hiện tại (tối đa 72 ký tự).';
  }
  const newPasswordError = validatePasswordComplexity(newPassword);
  if (newPasswordError) {
    return newPasswordError;
  }
  if (oldPassword === newPassword) {
    return 'Mật khẩu mới phải khác mật khẩu hiện tại.';
  }
  return null;
}

export function validateRegistrationForm(input: RegistrationValidationInput): string | null {
  const name = input.fullName.trim();
  if (name.length < 2 || name.length > 100) {
    return 'Họ và tên phải từ 2 đến 100 ký tự.';
  }
  const email = input.email.trim();
  if (!EMAIL_REGEX.test(email)) {
    return 'Email không đúng định dạng.';
  }
  const passwordError = validatePasswordComplexity(input.password);
  if (passwordError) {
    return passwordError;
  }
  if (input.phoneNumber) {
    const phoneError = validatePhoneNumber(input.phoneNumber, false);
    if (phoneError) {
      return phoneError;
    }
  }
  if (!input.acceptedTerms) {
    return 'Vui lòng đồng ý với điều khoản sử dụng.';
  }
  return null;
}

export function validateOtpCode(
  code: string,
  attempts: number,
  maxAttempts = OTP_MAX_ATTEMPTS_DEFAULT,
): { readonly valid: boolean; readonly error: string | null; readonly nextAttempts: number } {
  if (attempts >= maxAttempts) {
    return {
      valid: false,
      error: 'Đã vượt quá số lần thử OTP tối đa. Vui lòng yêu cầu mã mới.',
      nextAttempts: attempts,
    };
  }
  if (!/^\d{6}$/.test(code.trim())) {
    return {
      valid: false,
      error: 'Mã OTP phải gồm 6 chữ số.',
      nextAttempts: attempts + 1,
    };
  }
  return {
    valid: true,
    error: null,
    nextAttempts: attempts,
  };
}

export function validateProfileFullName(fullName: string): string | null {
  const trimmed = fullName.trim();
  if (trimmed.length < 2 || trimmed.length > 100) {
    return 'Họ và tên phải từ 2 đến 100 ký tự.';
  }
  return null;
}

export function checkRoleCapabilities(role: Role): {
  readonly isExpert: boolean;
  readonly isPhotographer: boolean;
} {
  const isExpert = role === Role.PHOTOGRAPHY_EXPERT;
  return {
    isExpert,
    isPhotographer: role === Role.PHOTOGRAPHER || isExpert,
  };
}
