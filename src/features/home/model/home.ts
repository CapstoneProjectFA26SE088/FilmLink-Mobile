import { type ServiceOrder, ServiceOrderStatus } from '@/shared/domain';

export type DashboardSummary = {
  readonly activeOrdersCount: number;
  readonly completedOrdersCount: number;
  readonly primaryActiveOrder: ServiceOrder | null;
};

function isCompletedOrderStatus(status: ServiceOrderStatus): boolean {
  return status === ServiceOrderStatus.DELIVERED || status === ServiceOrderStatus.CLOSED;
}

export function summarizeDashboardOrders(orders: readonly ServiceOrder[]): DashboardSummary {
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
