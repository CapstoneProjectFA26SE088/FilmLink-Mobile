import type { OrderStageRecord } from '@/shared/api';
import {
  ErrorCode,
  PROCESSING_STAGE_LABELS,
  PROCESSING_STAGE_ORDER,
  type ProcessingStage,
  type ServiceOrder,
  ServiceOrderStatus,
} from '@/shared/domain';
import { getErrorMessage, isNetworkError, normalizeProblemDetail } from '@/shared/lib';

export type OrderFilterTab = 'active' | 'completed' | 'all';

export type OrderStageTimelineItem = {
  readonly stage: ProcessingStage;
  readonly label: string;
  readonly isDone: boolean;
  readonly isCurrent: boolean;
  readonly recordedAt: string | null;
  readonly note: string | null;
};

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
  if (tab === 'completed') {
    return orders.filter((o) => isCompletedStatus(o.status));
  }
  return orders;
}

export function countOrdersByTab<T extends { readonly status: ServiceOrderStatus }>(
  orders: readonly T[],
): {
  readonly all: number;
  readonly active: number;
  readonly completed: number;
} {
  return {
    all: orders.length,
    active: filterOrdersByTab(orders, 'active').length,
    completed: filterOrdersByTab(orders, 'completed').length,
  };
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

export function mapOrderApiError(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Không thể kết nối tới máy chủ FilmLink. Vui lòng kiểm tra kết nối mạng.';
  }
  const problem = normalizeProblemDetail(error);
  if (problem.status === 503 && problem.errorCode === ErrorCode.PAYMENT_GATEWAY_NOT_CONFIGURED) {
    return 'Cổng thanh toán trực tuyến VNPay chưa được cấu hình trên máy chủ.';
  }
  if (problem.errorCode === ErrorCode.PAYMENT_GATEWAY_NOT_CONFIGURED) {
    return 'Cổng thanh toán trực tuyến VNPay chưa được cấu hình trên máy chủ.';
  }
  if (isSignedUrlExpiredError(error)) {
    return 'Liên kết ảnh đã hết hạn. Vui lòng làm mới để tải lại ảnh.';
  }
  const detail = getErrorMessage(error);
  return detail || 'Không thể tải dữ liệu đơn hàng. Vui lòng thử lại.';
}

export type LegacyOrderSummary = ServiceOrder;
