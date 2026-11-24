import { z } from 'zod';
import { FilmFormat, FilmProcess, HandoverMethod, PaymentMethod, ServiceTier } from '../enums';
import { validatePhoneNumber } from './auth';
import {
  MAX_EXPOSURE_COUNT,
  MAX_PUSH_PULL_STOPS,
  MAX_ROLL_COUNT,
  MAX_SHOOTING_ISO,
  MIN_EXPOSURE_COUNT,
  MIN_PUSH_PULL_STOPS,
  MIN_ROLL_COUNT,
  MIN_SHOOTING_ISO,
  PUSH_PULL_FEE_PER_STOP_VND,
} from './constants';

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
  if (
    order.paymentMethod !== PaymentMethod.ONLINE &&
    order.paymentMethod !== PaymentMethod.PAY_AT_LAB
  ) {
    return 'Chỉ hỗ trợ thanh toán tại Lab hoặc VNPay trực tuyến trong giai đoạn này.';
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
