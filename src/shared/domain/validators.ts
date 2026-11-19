import { z } from 'zod';
import {
  ArticleStatus,
  FilmFormat,
  FilmProcess,
  HandoverMethod,
  PaymentMethod,
  Role,
  ServiceTier,
} from './enums';

export const OTP_MAX_ATTEMPTS_DEFAULT = 5;
export const PUSH_PULL_FEE_PER_STOP_VND = 20_000;
export const MIN_CONSIGNMENT_PRICE_VND = 100_000;
export const MIN_ROLL_COUNT = 1;
export const MAX_ROLL_COUNT = 20;
export const MIN_PUSH_PULL_STOPS = -3;
export const MAX_PUSH_PULL_STOPS = 3;
export const MIN_EXPOSURE_COUNT = 1;
export const MAX_EXPOSURE_COUNT = 40;
export const MIN_SHOOTING_ISO = 1;
export const MAX_SHOOTING_ISO = 12_800;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72;
export const VN_PHONE_REGEX = /^(0|\+84)\d{9,10}$/;
export const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegistrationValidationInput = {
  readonly fullName: string;
  readonly email: string;
  readonly password: string;
  readonly phoneNumber?: string | null;
  readonly acceptedTerms: boolean;
};

export type FilmRollValidationInput = {
  readonly filmStockId?: number | null;
  readonly filmStockNameText?: string | null;
  readonly filmFormatId: number;
  readonly exposureCount: number;
  readonly shootingIso: number;
  readonly servicePackageId: number;
  readonly pushPullStops: number;
};

export type ServiceOrderValidationInput = {
  readonly filmLabId: number;
  readonly serviceTier: ServiceTier;
  readonly filmHandoverMethod: HandoverMethod;
  readonly paymentMethod: PaymentMethod;
  readonly specialRequest?: string | null;
  readonly rolls: readonly FilmRollValidationInput[];
  readonly customerAddressLine?: string | null;
  readonly customerDistrict?: string | null;
  readonly customerProvince?: string | null;
  readonly customerPhone?: string | null;
  readonly pickupWindowStartAt?: string | null;
  readonly pickupWindowEndAt?: string | null;
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

export function validateExpertApplicationExperience(experience: string): string | null {
  if (experience.trim().length < 20) {
    return 'Kinh nghiệm thực hành cần tối thiểu 20 ký tự.';
  }
  return null;
}

export function validateForumReplyContent(content: string): string | null {
  if (!content.trim()) {
    return 'Vui lòng nhập nội dung câu trả lời trước khi gửi.';
  }
  return null;
}

export function validateFilmRollInput(roll: FilmRollValidationInput): string | null {
  const hasStockId = roll.filmStockId !== null && roll.filmStockId !== undefined;
  const hasStockName = Boolean(roll.filmStockNameText?.trim());
  if ((hasStockId && hasStockName) || (!hasStockId && !hasStockName)) {
    return 'Phải chọn dòng phim từ danh mục hoặc nhập tên dòng phim tự do (chỉ 1 trong 2).';
  }
  if (hasStockName && roll.filmStockNameText && roll.filmStockNameText.trim().length > 100) {
    return 'Tên dòng phim tự do không được vượt quá 100 ký tự.';
  }
  if (roll.filmFormatId <= 0) {
    return 'Vui lòng chọn khổ phim hợp lệ.';
  }
  if (roll.servicePackageId <= 0) {
    return 'Vui lòng chọn gói dịch vụ tráng scan hợp lệ.';
  }
  if (roll.exposureCount < MIN_EXPOSURE_COUNT || roll.exposureCount > MAX_EXPOSURE_COUNT) {
    return `Số kiểu chụp trên cuộn phải từ ${MIN_EXPOSURE_COUNT} đến ${MAX_EXPOSURE_COUNT}.`;
  }
  if (roll.shootingIso < MIN_SHOOTING_ISO || roll.shootingIso > MAX_SHOOTING_ISO) {
    return `Độ nhạy sáng ISO phải trong khoảng ${MIN_SHOOTING_ISO} đến ${MAX_SHOOTING_ISO}.`;
  }
  if (roll.pushPullStops < MIN_PUSH_PULL_STOPS || roll.pushPullStops > MAX_PUSH_PULL_STOPS) {
    return `Số stop Push/Pull phải trong khoảng từ ${MIN_PUSH_PULL_STOPS} đến +${MAX_PUSH_PULL_STOPS}.`;
  }
  return null;
}

function validateOrderMetadata(order: ServiceOrderValidationInput): string | null {
  if (order.filmLabId <= 0) {
    return 'Vui lòng chọn Phòng Lab tiếp nhận.';
  }
  if (order.serviceTier !== ServiceTier.STANDARD) {
    return 'Chỉ hỗ trợ gói STANDARD trong giai đoạn này.';
  }
  if (
    order.filmHandoverMethod !== HandoverMethod.SELF_DROP_OFF &&
    order.filmHandoverMethod !== HandoverMethod.PICKUP
  ) {
    return 'Phương thức bàn giao không được hỗ trợ trong giai đoạn này.';
  }
  if (order.paymentMethod !== PaymentMethod.ONLINE) {
    return 'Chỉ hỗ trợ thanh toán trực tuyến trong giai đoạn này.';
  }
  if (order.specialRequest && order.specialRequest.length > 500) {
    return 'Yêu cầu đặc biệt không được vượt quá 500 ký tự.';
  }
  return null;
}

function validateOrderRolls(rolls: readonly FilmRollValidationInput[]): string | null {
  if (rolls.length < MIN_ROLL_COUNT || rolls.length > MAX_ROLL_COUNT) {
    return `Đơn hàng phải có từ ${MIN_ROLL_COUNT} đến ${MAX_ROLL_COUNT} cuộn phim.`;
  }
  for (let idx = 0; idx < rolls.length; idx += 1) {
    const roll = rolls[idx];
    if (roll) {
      const rollError = validateFilmRollInput(roll);
      if (rollError) {
        return `Cuộn #${idx + 1}: ${rollError}`;
      }
    }
  }
  return null;
}

function validatePickupWindow(
  address?: string | null,
  district?: string | null,
  province?: string | null,
  phone?: string | null,
  startAt?: string | null,
  endAt?: string | null,
): string | null {
  if (!address?.trim()) {
    return 'Vui lòng nhập địa chỉ lấy phim.';
  }
  if (!district?.trim()) {
    return 'Vui lòng nhập quận/huyện lấy phim.';
  }
  if (!province?.trim()) {
    return 'Vui lòng nhập tỉnh/thành phố lấy phim.';
  }
  const phoneError = validatePhoneNumber(phone ?? '', true);
  if (phoneError) {
    return phoneError;
  }
  if (!startAt || !endAt) {
    return 'Vui lòng chọn khung giờ lấy phim.';
  }
  if (new Date(startAt).getTime() >= new Date(endAt).getTime()) {
    return 'Khung giờ bắt đầu phải trước khung giờ kết thúc.';
  }
  return null;
}

export function validateServiceOrderRequestInput(
  order: ServiceOrderValidationInput,
): string | null {
  const metaError = validateOrderMetadata(order);
  if (metaError) {
    return metaError;
  }
  const rollsError = validateOrderRolls(order.rolls);
  if (rollsError) {
    return rollsError;
  }
  if (order.filmHandoverMethod === HandoverMethod.PICKUP) {
    return validatePickupWindow(
      order.customerAddressLine,
      order.customerDistrict,
      order.customerProvince,
      order.customerPhone,
      order.pickupWindowStartAt,
      order.pickupWindowEndAt,
    );
  }
  return null;
}

export function validateConsignmentOfferPrice(
  priceText: string,
  currentPrice: number,
): { readonly valid: boolean; readonly numericPrice?: number; readonly error?: string | null } {
  const sanitized = priceText.replace(/[^0-9]/g, '');
  const numericPrice = Number(sanitized);
  if (!sanitized || Number.isNaN(numericPrice)) {
    return { valid: false, error: 'Giá đề xuất không hợp lệ.' };
  }
  const minAllowed = currentPrice * 0.6;
  const maxAllowed = currentPrice;
  if (numericPrice < minAllowed || numericPrice > maxAllowed) {
    return {
      valid: false,
      error: `Giá trả phải từ 60% đến 100% giá gốc (${minAllowed.toLocaleString('vi-VN')} ₫ – ${maxAllowed.toLocaleString('vi-VN')} ₫).`,
    };
  }
  return { valid: true, numericPrice, error: null };
}

export function validateConsignmentListingInput(input: {
  readonly title: string;
  readonly priceText: string;
}): { readonly valid: boolean; readonly numericPrice?: number; readonly error?: string | null } {
  if (!input.title.trim()) {
    return { valid: false, error: 'Vui lòng nhập tên thiết bị ký gửi.' };
  }
  const sanitized = input.priceText.replace(/[^0-9]/g, '');
  const numericPrice = Number(sanitized);
  if (!sanitized || Number.isNaN(numericPrice) || numericPrice < MIN_CONSIGNMENT_PRICE_VND) {
    return {
      valid: false,
      error: `Giá ký gửi tối thiểu là ${MIN_CONSIGNMENT_PRICE_VND.toLocaleString('vi-VN')} ₫.`,
    };
  }
  return { valid: true, numericPrice, error: null };
}

export function getArticleStatusBadgeMeta(status: ArticleStatus): {
  readonly label: string;
  readonly tone: 'success' | 'warning' | 'info';
} {
  switch (status) {
    case ArticleStatus.KB_APPROVED:
      return { label: 'Đã tích hợp AI Knowledge Base', tone: 'success' };
    case ArticleStatus.KB_PENDING:
      return { label: 'Chờ duyệt Knowledge Base', tone: 'warning' };
    default:
      return { label: 'Đã xuất bản cộng đồng', tone: 'info' };
  }
}

export function calculateBookingPricing(
  unitPrice: number,
  rollCount: number,
  pushPullStops: number,
): {
  readonly baseAmount: number;
  readonly pushPullFee: number;
  readonly effectiveUnitPrice: number;
  readonly totalPrice: number;
} {
  const safeRollCount = Math.max(MIN_ROLL_COUNT, Math.round(rollCount));
  const stopsCount = Math.abs(pushPullStops);
  const baseAmount = unitPrice * safeRollCount;
  const pushPullFee = stopsCount * PUSH_PULL_FEE_PER_STOP_VND * safeRollCount;
  const effectiveUnitPrice = unitPrice + stopsCount * PUSH_PULL_FEE_PER_STOP_VND;
  return {
    baseAmount,
    pushPullFee,
    effectiveUnitPrice,
    totalPrice: baseAmount + pushPullFee,
  };
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

export const BookingDraftSchema = z.object({
  labId: z.string(),
  labName: z.string(),
  packageId: z.string(),
  packageName: z.string(),
  unitPrice: z.number().nonnegative(),
  filmStock: z.string(),
  filmFormat: z.enum([FilmFormat.FORMAT_35MM, FilmFormat.FORMAT_120, FilmFormat.FORMAT_LARGE]),
  filmProcess: z.enum([FilmProcess.C41, FilmProcess.BW, FilmProcess.E6, FilmProcess.ECN2]),
  rollCount: z.number().int().min(MIN_ROLL_COUNT).max(MAX_ROLL_COUNT),
  pushPullStops: z.number().int().min(MIN_PUSH_PULL_STOPS).max(MAX_PUSH_PULL_STOPS),
  handoverMethod: z.enum([
    HandoverMethod.SELF_DROP_OFF,
    HandoverMethod.PICKUP,
    HandoverMethod.PARCEL_SHIPPING,
  ]),
  note: z.string(),
});
