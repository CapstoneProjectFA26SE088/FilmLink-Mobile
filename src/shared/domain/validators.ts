import { ArticleStatus, HandoverMethod, PaymentMethod, Role, ServiceTier } from './enums';

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

export type RegistrationValidationInput = {
  readonly fullName: string;
  readonly email: string;
  readonly password: string;
  readonly phoneNumber?: string;
  readonly acceptedTerms: boolean;
};

export function validateRegistrationForm(input: RegistrationValidationInput): string | null {
  const trimmedName = input.fullName.trim();
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    return 'Họ và tên cần từ 2 đến 100 ký tự (UC06).';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return 'Vui lòng nhập địa chỉ email hợp lệ.';
  }
  const passwordError = validatePasswordComplexity(input.password);
  if (passwordError) {
    return passwordError;
  }
  if (input.phoneNumber !== undefined) {
    const phoneError = validatePhoneNumber(input.phoneNumber, false);
    if (phoneError) {
      return phoneError;
    }
  }
  if (!input.acceptedTerms) {
    return 'Bạn cần đồng ý với điều khoản sử dụng của FilmLink.';
  }
  return null;
}

export function validateOtpCode(
  otp: string,
  attempts: number,
  maxAttempts: number = OTP_MAX_ATTEMPTS_DEFAULT,
): { readonly valid: boolean; readonly error: string | null; readonly nextAttempts: number } {
  if (attempts >= maxAttempts) {
    return {
      valid: false,
      error: 'Đã nhập sai quá 5 lần cho phép. Vui lòng yêu cầu gửi lại mã mới.',
      nextAttempts: attempts,
    };
  }

  if (!/^\d{6}$/.test(otp.trim())) {
    const nextAttempts = attempts + 1;
    const remaining = Math.max(0, maxAttempts - nextAttempts);
    return {
      valid: false,
      error: `Mã OTP phải gồm đúng 6 chữ số. Số lần thử còn lại: ${remaining}`,
      nextAttempts,
    };
  }

  return { valid: true, error: null, nextAttempts: attempts };
}

export function validateProfileFullName(fullName: string): string | null {
  const trimmedName = fullName.trim();
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    return 'Họ và tên hiển thị cần từ 2 đến 100 ký tự (UC06).';
  }
  return null;
}

export type FilmRollValidationInput = {
  readonly filmStockId?: number | null;
  readonly filmStockNameText?: string | null;
  readonly filmFormatId: number;
  readonly exposureCount: number;
  readonly shootingIso?: number | null;
  readonly servicePackageId: number;
  readonly pushPullStops?: number | null;
};

function isIntegerInRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

function validateFilmStockChoice(
  filmStockId: number | null | undefined,
  filmStockNameText: string | null | undefined,
): string | null {
  const hasStockId =
    typeof filmStockId === 'number' && Number.isInteger(filmStockId) && filmStockId > 0;
  const trimmedName = filmStockNameText?.trim() ?? '';
  const hasStockName = trimmedName.length > 0;
  if (hasStockId === hasStockName) {
    return 'Mỗi cuộn phim cần chọn 1 loại phim từ danh mục hoặc nhập tên phim (không đồng thời cả hai).';
  }
  if (trimmedName.length > 100) {
    return 'Tên loại phim nhập tay tối đa 100 ký tự.';
  }
  return null;
}

export function validateFilmRollInput(input: FilmRollValidationInput): string | null {
  const stockError = validateFilmStockChoice(input.filmStockId, input.filmStockNameText);
  if (stockError) {
    return stockError;
  }
  if (!Number.isInteger(input.filmFormatId) || input.filmFormatId <= 0) {
    return 'Vui lòng chọn khổ phim hợp lệ cho cuộn phim.';
  }
  if (!Number.isInteger(input.servicePackageId) || input.servicePackageId <= 0) {
    return 'Vui lòng chọn gói dịch vụ tráng/scan hợp lệ.';
  }
  if (!isIntegerInRange(input.exposureCount, MIN_EXPOSURE_COUNT, MAX_EXPOSURE_COUNT)) {
    return `Số kiểu ảnh mỗi cuộn phải nằm trong khoảng ${MIN_EXPOSURE_COUNT}–${MAX_EXPOSURE_COUNT}.`;
  }
  if (
    input.shootingIso !== undefined &&
    input.shootingIso !== null &&
    !isIntegerInRange(input.shootingIso, MIN_SHOOTING_ISO, MAX_SHOOTING_ISO)
  ) {
    return `ISO chụp thực tế cần nằm trong khoảng ${MIN_SHOOTING_ISO}–${MAX_SHOOTING_ISO}.`;
  }
  if (
    input.pushPullStops !== undefined &&
    input.pushPullStops !== null &&
    !isIntegerInRange(input.pushPullStops, MIN_PUSH_PULL_STOPS, MAX_PUSH_PULL_STOPS)
  ) {
    return `Số stop Push/Pull cần nằm trong khoảng ${MIN_PUSH_PULL_STOPS} đến +${MAX_PUSH_PULL_STOPS}.`;
  }
  return null;
}

export type ServiceOrderValidationInput = {
  readonly filmLabId: number;
  readonly serviceTier: ServiceTier;
  readonly filmHandoverMethod: HandoverMethod;
  readonly paymentMethod: PaymentMethod;
  readonly specialRequest?: string;
  readonly customerAddressLine?: string;
  readonly customerDistrict?: string;
  readonly customerProvince?: string;
  readonly customerPhone?: string;
  readonly pickupWindowStartAt?: string;
  readonly pickupWindowEndAt?: string;
  readonly rolls: readonly FilmRollValidationInput[];
};

function validateOrderOptions(input: ServiceOrderValidationInput): string | null {
  if (input.serviceTier !== ServiceTier.STANDARD) {
    return 'Tùy chọn Express hiện chưa được hỗ trợ trên hệ thống.';
  }
  if (input.filmHandoverMethod === HandoverMethod.PARCEL_SHIPPING) {
    return 'Phương thức gửi bưu kiện liên tỉnh hiện chưa được hỗ trợ.';
  }
  if (input.paymentMethod === PaymentMethod.COD) {
    return 'Thanh toán COD hiện chưa được hỗ trợ.';
  }
  if (input.specialRequest && input.specialRequest.trim().length > 500) {
    return 'Yêu cầu đặc biệt tối đa 500 ký tự.';
  }
  return null;
}

function validatePickupDetails(input: ServiceOrderValidationInput): string | null {
  if (input.filmHandoverMethod !== HandoverMethod.PICKUP) {
    return null;
  }
  const address = input.customerAddressLine?.trim() ?? '';
  const district = input.customerDistrict?.trim() ?? '';
  const province = input.customerProvince?.trim() ?? '';
  if (!address || address.length > 255) {
    return 'Vui lòng nhập địa chỉ lấy phim hợp lệ (tối đa 255 ký tự).';
  }
  if (!district || district.length > 100 || !province || province.length > 100) {
    return 'Vui lòng nhập đầy đủ quận/huyện và tỉnh/thành phố lấy phim.';
  }
  const phoneError = validatePhoneNumber(input.customerPhone ?? '', true);
  if (phoneError) {
    return phoneError;
  }
  const startMs = Date.parse(input.pickupWindowStartAt ?? '');
  const endMs = Date.parse(input.pickupWindowEndAt ?? '');
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
    return 'Khung giờ kết thúc lấy phim phải sau thời điểm bắt đầu.';
  }
  return null;
}

export function validateServiceOrderRequestInput(
  input: ServiceOrderValidationInput,
): string | null {
  if (!Number.isInteger(input.filmLabId) || input.filmLabId <= 0) {
    return 'Vui lòng chọn Phòng Lab hợp lệ.';
  }
  const optionError = validateOrderOptions(input);
  if (optionError) {
    return optionError;
  }
  const pickupError = validatePickupDetails(input);
  if (pickupError) {
    return pickupError;
  }
  if (input.rolls.length < MIN_ROLL_COUNT || input.rolls.length > MAX_ROLL_COUNT) {
    return `Mỗi đơn hàng cần có từ ${MIN_ROLL_COUNT} đến ${MAX_ROLL_COUNT} cuộn phim.`;
  }
  for (const roll of input.rolls) {
    const rollError = validateFilmRollInput(roll);
    if (rollError) {
      return rollError;
    }
  }
  return null;
}

export function validateExpertApplicationExperience(experience: string): string | null {
  if (experience.trim().length < 20) {
    return 'Vui lòng mô tả kinh nghiệm thực tế tối thiểu 20 ký tự (UC11 / BR-36).';
  }
  return null;
}

export function validateConsignmentOfferPrice(
  offerPriceText: string,
  listedPriceVnd: number,
): { readonly valid: boolean; readonly numericPrice: number; readonly error: string | null } {
  const numericPrice = Number(offerPriceText.replace(/[^\d]/g, ''));
  if (!numericPrice || numericPrice < listedPriceVnd * 0.6 || numericPrice > listedPriceVnd) {
    return {
      valid: false,
      numericPrice: 0,
      error: 'Mức giá đề xuất cần nằm trong khoảng từ 60% đến 100% giá niêm yết.',
    };
  }
  return { valid: true, numericPrice, error: null };
}

export function validateConsignmentListingInput(input: {
  readonly title: string;
  readonly priceText: string;
}): { readonly valid: boolean; readonly numericPrice: number; readonly error: string | null } {
  if (!input.title.trim()) {
    return {
      valid: false,
      numericPrice: 0,
      error: 'Vui lòng nhập tên thiết bị ký gửi (BR-51).',
    };
  }

  const numericPrice = Number(input.priceText.replace(/[^\d]/g, ''));
  if (!numericPrice || numericPrice < MIN_CONSIGNMENT_PRICE_VND) {
    return {
      valid: false,
      numericPrice: 0,
      error: 'Giá ký gửi tối thiểu là 100.000 ₫.',
    };
  }

  return { valid: true, numericPrice, error: null };
}

export function validateForumReplyContent(content: string): string | null {
  if (!content.trim()) {
    return 'Vui lòng nhập nội dung câu trả lời trước khi gửi.';
  }
  return null;
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
