import { type ServiceOrder, ServiceOrderStatus } from '@/shared/domain';
import { getErrorMessage, isNetworkError } from '@/shared/lib';

export type DashboardSummary<T = ServiceOrder> = {
  readonly activeOrdersCount: number;
  readonly completedOrdersCount: number;
  readonly primaryActiveOrder: T | null;
};

function isCompletedOrderStatus(status: ServiceOrderStatus): boolean {
  return status === ServiceOrderStatus.DELIVERED || status === ServiceOrderStatus.CLOSED;
}

export function summarizeDashboardOrders<T extends { readonly status: ServiceOrderStatus }>(
  orders: readonly T[],
): DashboardSummary<T> {
  const activeOrders = orders.filter(
    (order) =>
      !isCompletedOrderStatus(order.status) && order.status !== ServiceOrderStatus.CANCELLED,
  );
  const completedOrders = orders.filter((order) => isCompletedOrderStatus(order.status));
  return {
    activeOrdersCount: activeOrders.length,
    completedOrdersCount: completedOrders.length,
    primaryActiveOrder: activeOrders[0] ?? null,
  };
}

export function extractFirstName(fullName: string | undefined): string {
  const parts = fullName?.trim().split(/\s+/);
  const last = parts?.[parts.length - 1];
  return last || 'bạn';
}

export function mapHomeApiError(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Không thể kết nối tới máy chủ FilmLink. Vui lòng kiểm tra kết nối mạng.';
  }
  const detail = getErrorMessage(error);
  return detail || 'Không thể tải dữ liệu trang chủ. Vui lòng thử lại.';
}
