import type { OrderStageRecord, PageResponse } from '@/shared/api';
import {
  ErrorCode,
  PROCESSING_STAGE_LABELS,
  PROCESSING_STAGE_ORDER,
  type ProcessingStage,
  type ServiceOrder,
  ServiceOrderStatus,
} from '@/shared/domain';
import { getErrorMessage, isNetworkError, normalizeProblemDetail } from '@/shared/lib';

export type OrderFilterTab = 'active' | 'archive' | 'all';

export type OrderStageTimelineItem = {
  readonly stage: ProcessingStage;
  readonly label: string;
  readonly isDone: boolean;
  readonly isCurrent: boolean;
  readonly recordedAt: string | null;
  readonly note: string | null;
};

const CANCELLABLE_ORDER_STATUSES: ReadonlySet<ServiceOrderStatus> = new Set([
  ServiceOrderStatus.AWAITING_PAYMENT,
  ServiceOrderStatus.AWAITING_LAB_CONFIRMATION,
  ServiceOrderStatus.AWAITING_FILM,
]);

export function canCancelOrder(status: ServiceOrderStatus): boolean {
  return CANCELLABLE_ORDER_STATUSES.has(status);
}

export function canConfirmReceiptOrder(status: ServiceOrderStatus): boolean {
  return status === ServiceOrderStatus.DELIVERED;
}

export function validateCancelReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (trimmed.length < 10) {
    return 'Lý do hủy đơn phải có ít nhất 10 ký tự.';
  }
  if (trimmed.length > 500) {
    return 'Lý do hủy đơn không được vượt quá 500 ký tự.';
  }
  return null;
}

function isCompletedStatus(status: ServiceOrderStatus): boolean {
  return status === ServiceOrderStatus.DELIVERED || status === ServiceOrderStatus.CLOSED;
}

export function filterOrdersByTab<T extends { readonly status: ServiceOrderStatus }>(
  orders: readonly T[],
  tab: OrderFilterTab,
): readonly T[] {
  if (tab === 'active') {
    return orders.filter(
      (o) => !isCompletedStatus(o.status) && o.status !== ServiceOrderStatus.CANCELLED,
    );
  }
  if (tab === 'archive') {
    return orders.filter((o) => isCompletedStatus(o.status));
  }
  return orders;
}

export function countOrdersByTab<T extends { readonly status: ServiceOrderStatus }>(
  orders: readonly T[],
  archiveTotal?: number,
): {
  readonly all: number;
  readonly active: number;
  readonly archive: number;
} {
  return {
    all: orders.length,
    active: filterOrdersByTab(orders, 'active').length,
    archive: archiveTotal ?? filterOrdersByTab(orders, 'archive').length,
  };
}

export function flattenPages<T>(pages: readonly PageResponse<T>[] | undefined): readonly T[] {
  if (!pages) {
    return [];
  }
  return pages.flatMap((page) => page.content);
}

function getHighestRecordedStageIndex(
  stageMap: ReadonlyMap<ProcessingStage, OrderStageRecord>,
): number {
  let highest = -1;
  PROCESSING_STAGE_ORDER.forEach((stage, index) => {
    if (stageMap.has(stage)) {
      highest = index;
    }
  });
  return highest;
}

export function buildOrderStageTimeline(
  stages: readonly OrderStageRecord[],
): readonly OrderStageTimelineItem[] {
  const stageMap = new Map<ProcessingStage, OrderStageRecord>();
  for (const record of stages) {
    stageMap.set(record.stage, record);
  }
  const highestIndex = getHighestRecordedStageIndex(stageMap);

  return PROCESSING_STAGE_ORDER.map((stage, index) => {
    const record = stageMap.get(stage);
    return {
      stage,
      label: PROCESSING_STAGE_LABELS[stage],
      isDone: Boolean(record) || index < highestIndex,
      isCurrent: highestIndex >= 0 && index === highestIndex,
      recordedAt: record?.recordedAt ?? null,
      note: record?.note ?? null,
    };
  });
}

export function computeOrderProgressPct(
  status: ServiceOrderStatus,
  stages: readonly OrderStageRecord[],
): number {
  if (isCompletedStatus(status)) {
    return 100;
  }
  if (status === ServiceOrderStatus.CANCELLED) {
    return 0;
  }
  const stageMap = new Map<ProcessingStage, OrderStageRecord>();
  for (const record of stages) {
    stageMap.set(record.stage, record);
  }
  const highestIndex = getHighestRecordedStageIndex(stageMap);
  if (highestIndex < 0) {
    return 0;
  }
  return Math.round(((highestIndex + 1) / PROCESSING_STAGE_ORDER.length) * 100);
}

export function isSignedUrlExpiredError(error: unknown): boolean {
  const problem = normalizeProblemDetail(error);
  return problem.status === 403 && problem.errorCode === ErrorCode.STORAGE_LINK_INVALID;
}

const ORDER_ERROR_MAP: Readonly<Record<string, string>> = {
  [ErrorCode.PAYMENT_GATEWAY_NOT_CONFIGURED]:
    'Cổng thanh toán trực tuyến VNPay chưa được cấu hình trên máy chủ.',
  [ErrorCode.ORDER_STATUS_CONFLICT]: 'Trạng thái đơn hàng đã thay đổi. Vui lòng làm mới danh sách.',
  [ErrorCode.ORDER_NOT_FOUND]: 'Không tìm thấy đơn hàng yêu cầu.',
  [ErrorCode.ARCHIVE_ROLL_NOT_FOUND]:
    'Không tìm thấy cuộn phim trong Lưu trữ số hoặc đơn chưa giao file scan.',
};

export function mapOrderApiError(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Không thể kết nối tới máy chủ FilmLink. Vui lòng kiểm tra kết nối mạng.';
  }
  if (isSignedUrlExpiredError(error)) {
    return 'Liên kết ảnh đã hết hạn. Vui lòng làm mới để tải lại ảnh.';
  }
  const problem = normalizeProblemDetail(error);
  const mapped = problem.errorCode ? ORDER_ERROR_MAP[problem.errorCode] : undefined;
  if (mapped) {
    return mapped;
  }
  const detail = getErrorMessage(error);
  return detail || 'Không thể tải dữ liệu đơn hàng. Vui lòng thử lại.';
}

export type LegacyOrderSummary = ServiceOrder;
