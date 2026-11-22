import { z } from 'zod';
import type {
  CreateServiceOrderRequest,
  FilmLabOpeningHour,
  PublicFilmLabSearchParams,
  PublicFilmLabSummaryResponse,
  SubmitServiceOrderRequest,
} from '@/shared/api';
import {
  ErrorCode,
  type FilmFormat,
  type FilmLab,
  type FilmProcess,
  HandoverMethod,
  MAX_EXPOSURE_COUNT,
  MAX_PUSH_PULL_STOPS,
  MAX_ROLL_COUNT,
  MAX_SHOOTING_ISO,
  MIN_EXPOSURE_COUNT,
  MIN_PUSH_PULL_STOPS,
  MIN_ROLL_COUNT,
  MIN_SHOOTING_ISO,
  PaymentMethod,
  ServiceTier,
} from '@/shared/domain';
import { getErrorMessage, hasErrorCode, isNetworkError } from '@/shared/lib';

export type LabFilterCriteria = {
  readonly search: string;
  readonly process: FilmProcess | 'ALL';
  readonly format: FilmFormat | 'ALL';
};

export type PublicLabSearchInput = {
  readonly processId?: number | 'ALL';
  readonly formatId?: number | 'ALL';
  readonly size?: number;
};

export type LiveBookingInput = {
  readonly filmLabId: number;
  readonly servicePackageId: number;
  readonly filmFormatId: number;
  readonly servicePackageScanOptionId?: number | null;
  readonly filmStockId?: number | null;
  readonly filmStockNameText?: string | null;
  readonly rollCount: number;
  readonly exposureCount: number;
  readonly shootingIso: number;
  readonly pushPullStops: number;
  readonly filmHandoverMethod: HandoverMethod;
  readonly specialRequest?: string;
  readonly customerAddressLine?: string;
  readonly customerDistrict?: string;
  readonly customerProvince?: string;
  readonly customerPhone?: string;
  readonly pickupWindowStartAt?: string;
  readonly pickupWindowEndAt?: string;
};

export const LiveBookingDraftSchema = z.object({
  filmStockId: z.number().int().positive().nullable(),
  filmStockNameText: z.string(),
  scanOptionId: z.number().int().positive().nullable(),
  rollCount: z.number().int().min(MIN_ROLL_COUNT).max(MAX_ROLL_COUNT),
  exposureCount: z.number().int().min(MIN_EXPOSURE_COUNT).max(MAX_EXPOSURE_COUNT),
  shootingIso: z.number().int().min(MIN_SHOOTING_ISO).max(MAX_SHOOTING_ISO),
  pushPullStops: z.number().int().min(MIN_PUSH_PULL_STOPS).max(MAX_PUSH_PULL_STOPS),
  handoverMethod: z.enum([HandoverMethod.SELF_DROP_OFF, HandoverMethod.PICKUP]),
  specialRequest: z.string(),
  customerAddressLine: z.string(),
  customerDistrict: z.string(),
  customerProvince: z.string(),
  customerPhone: z.string(),
  pickupWindowStartAt: z.string(),
  pickupWindowEndAt: z.string(),
});

export type LiveBookingDraft = z.infer<typeof LiveBookingDraftSchema>;

const DAY_LABELS: Readonly<Record<number, string>> = {
  1: 'T2',
  2: 'T3',
  3: 'T4',
  4: 'T5',
  5: 'T6',
  6: 'T7',
  7: 'CN',
};

const SERVICE_ERROR_MESSAGES: ReadonlyArray<readonly [ErrorCode, string]> = [
  [ErrorCode.ORDER_LAB_NOT_ACCEPTING, 'Phòng Lab hiện tạm ngưng tiếp nhận đơn hàng mới.'],
  [ErrorCode.ORDER_PACKAGE_NOT_ORDERABLE, 'Gói dịch vụ đã ngừng cung cấp hoặc không hợp lệ.'],
  [ErrorCode.ORDER_FILM_FORMAT_MISMATCH, 'Khổ phim không tương thích với gói dịch vụ đã chọn.'],
  [ErrorCode.ORDER_SCAN_OPTION_INVALID, 'Tùy chọn scan không hợp lệ cho gói dịch vụ này.'],
  [ErrorCode.ORDER_PUSH_PULL_NOT_AVAILABLE, 'Gói dịch vụ này không hỗ trợ Push/Pull.'],
  [ErrorCode.ORDER_FILM_STOCK_INVALID, 'Thông tin dòng phim không hợp lệ.'],
  [ErrorCode.ORDER_OPTION_NOT_SUPPORTED, 'Phương thức hoặc tùy chọn đơn hàng chưa được hỗ trợ.'],
  [ErrorCode.ORDER_SCHEDULE_INFEASIBLE, 'Lịch hẹn hiện tại không khả dụng tại Phòng Lab.'],
];

export function filterLabs(
  labs: readonly FilmLab[],
  filters: LabFilterCriteria,
): readonly FilmLab[] {
  const query = filters.search.trim().toLowerCase();
  return labs.filter((lab) => {
    const matchesQuery =
      !query || lab.name.toLowerCase().includes(query) || lab.city.toLowerCase().includes(query);
    const matchesProcess =
      filters.process === 'ALL' || lab.supportedProcesses.includes(filters.process);
    const matchesFormat = filters.format === 'ALL' || lab.supportedFormats.includes(filters.format);
    return matchesQuery && matchesProcess && matchesFormat;
  });
}

export function filterPublicLabSummaries(
  labs: readonly PublicFilmLabSummaryResponse[],
  search: string,
): readonly PublicFilmLabSummaryResponse[] {
  const query = search.trim().toLowerCase();
  if (!query) {
    return labs;
  }
  return labs.filter(
    (lab) =>
      lab.labName.toLowerCase().includes(query) ||
      lab.district.toLowerCase().includes(query) ||
      lab.province.toLowerCase().includes(query),
  );
}

export function buildPublicLabSearchParams({
  processId,
  formatId,
  size,
}: PublicLabSearchInput): PublicFilmLabSearchParams {
  return {
    ...(typeof processId === 'number' && processId > 0 ? { filmProcessId: processId } : {}),
    ...(typeof formatId === 'number' && formatId > 0 ? { filmFormatId: formatId } : {}),
    ...(size !== undefined ? { size } : {}),
  };
}

function formatOpeningSlot(hour: FilmLabOpeningHour): string {
  if (hour.closed) {
    return 'Nghỉ';
  }
  if (hour.opensAt && hour.closesAt) {
    return `${hour.opensAt.slice(0, 5)}–${hour.closesAt.slice(0, 5)}`;
  }
  return 'Mở cửa';
}

function formatDayLabel(dayOfWeek: number): string {
  return DAY_LABELS[dayOfWeek] ?? `T${dayOfWeek}`;
}

export function formatOpeningHoursSummary(hours: readonly FilmLabOpeningHour[]): string {
  if (hours.length === 0) {
    return 'Liên hệ Phòng Lab để biết giờ mở cửa';
  }
  const sorted = [...hours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const groups: Array<{ startDay: number; endDay: number; slot: string }> = [];

  for (const hour of sorted) {
    const slot = formatOpeningSlot(hour);
    const prev = groups[groups.length - 1];
    if (prev && prev.slot === slot && prev.endDay + 1 === hour.dayOfWeek) {
      prev.endDay = hour.dayOfWeek;
    } else {
      groups.push({ startDay: hour.dayOfWeek, endDay: hour.dayOfWeek, slot });
    }
  }

  return groups
    .map((group) => {
      const range =
        group.startDay === group.endDay
          ? formatDayLabel(group.startDay)
          : `${formatDayLabel(group.startDay)}–${formatDayLabel(group.endDay)}`;
      return `${range}: ${group.slot}`;
    })
    .join(' · ');
}

export function clampRollCount(current: number, delta: number): number {
  return Math.min(MAX_ROLL_COUNT, Math.max(MIN_ROLL_COUNT, Math.round(current + delta)));
}

export function clampPushPullStops(current: number, delta: number): number {
  return Math.min(MAX_PUSH_PULL_STOPS, Math.max(MIN_PUSH_PULL_STOPS, Math.round(current + delta)));
}

export function clampExposureCount(current: number, delta: number): number {
  return Math.min(MAX_EXPOSURE_COUNT, Math.max(MIN_EXPOSURE_COUNT, Math.round(current + delta)));
}

export function clampShootingIso(iso: number): number {
  return Math.min(MAX_SHOOTING_ISO, Math.max(MIN_SHOOTING_ISO, Math.round(iso)));
}

export function buildPickupWindowRange(
  preset: 'MORNING' | 'AFTERNOON',
  baseDate: Date = new Date(),
): { readonly startAt: string; readonly endAt: string } {
  const vnNow = new Date(baseDate.getTime() + 7 * 60 * 60 * 1000);
  vnNow.setUTCDate(vnNow.getUTCDate() + 1);
  const datePart = vnNow.toISOString().slice(0, 10);
  if (preset === 'AFTERNOON') {
    return {
      startAt: `${datePart}T14:00:00+07:00`,
      endAt: `${datePart}T17:00:00+07:00`,
    };
  }
  return {
    startAt: `${datePart}T09:00:00+07:00`,
    endAt: `${datePart}T12:00:00+07:00`,
  };
}

function trimToOptional(value: string | undefined, maxLength: number): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function resolveRollStockSelection(input: LiveBookingInput): {
  readonly filmStockId: number | null;
  readonly filmStockNameText: string | null;
} {
  const validStockId =
    typeof input.filmStockId === 'number' &&
    Number.isInteger(input.filmStockId) &&
    input.filmStockId > 0
      ? input.filmStockId
      : null;
  if (validStockId !== null) {
    return { filmStockId: validStockId, filmStockNameText: null };
  }
  const customName = trimToOptional(input.filmStockNameText ?? undefined, 100) ?? null;
  return { filmStockId: null, filmStockNameText: customName };
}

function buildPickupFields(input: LiveBookingInput): Partial<CreateServiceOrderRequest> {
  if (input.filmHandoverMethod !== HandoverMethod.PICKUP) {
    return {};
  }
  const address = trimToOptional(input.customerAddressLine, 255);
  const district = trimToOptional(input.customerDistrict, 100);
  const province = trimToOptional(input.customerProvince, 100);
  const phone = input.customerPhone?.replace(/\s+/g, '');
  const startAt = input.pickupWindowStartAt?.trim();
  const endAt = input.pickupWindowEndAt?.trim();
  return {
    ...(address ? { customerAddressLine: address } : {}),
    ...(district ? { customerDistrict: district } : {}),
    ...(province ? { customerProvince: province } : {}),
    ...(phone ? { customerPhone: phone } : {}),
    ...(startAt ? { pickupWindowStartAt: startAt } : {}),
    ...(endAt ? { pickupWindowEndAt: endAt } : {}),
  };
}

export function buildLiveOrderPayload(input: LiveBookingInput): CreateServiceOrderRequest {
  const rollCount = clampRollCount(input.rollCount, 0);
  const exposureCount = clampExposureCount(input.exposureCount, 0);
  const shootingIso = clampShootingIso(input.shootingIso);
  const pushPullStops = clampPushPullStops(input.pushPullStops, 0);
  const { filmStockId, filmStockNameText } = resolveRollStockSelection(input);
  const scanOptionId =
    typeof input.servicePackageScanOptionId === 'number' && input.servicePackageScanOptionId > 0
      ? input.servicePackageScanOptionId
      : null;
  const specialRequest = trimToOptional(input.specialRequest, 500);

  const rolls = Array.from({ length: rollCount }, () => ({
    filmStockId,
    filmStockNameText,
    filmFormatId: input.filmFormatId,
    exposureCount,
    shootingIso,
    servicePackageId: input.servicePackageId,
    servicePackageScanOptionId: scanOptionId,
    pushPullStops,
  }));

  return {
    filmLabId: input.filmLabId,
    serviceTier: ServiceTier.STANDARD,
    filmHandoverMethod: input.filmHandoverMethod,
    paymentMethod: PaymentMethod.ONLINE,
    ...(specialRequest ? { specialRequest } : {}),
    ...buildPickupFields(input),
    rolls,
  };
}

export function buildSubmitOrderPayload(
  input: LiveBookingInput,
  idempotencyKey: string,
): SubmitServiceOrderRequest {
  return {
    ...buildLiveOrderPayload(input),
    idempotencyKey,
  };
}

export function mapServiceApiError(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Không thể kết nối tới máy chủ FilmLink. Vui lòng kiểm tra kết nối mạng.';
  }
  for (const [code, message] of SERVICE_ERROR_MESSAGES) {
    if (hasErrorCode(error, code)) {
      return message;
    }
  }
  const detail = getErrorMessage(error);
  return detail || 'Không thể xử lý yêu cầu dịch vụ Phòng Lab. Vui lòng thử lại.';
}
