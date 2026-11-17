import { type ServiceOrder, ServiceOrderStatus } from '@/shared/domain';

export type OrderFilterTab = 'active' | 'completed' | 'all';

function isCompletedStatus(status: ServiceOrderStatus): boolean {
  return status === ServiceOrderStatus.DELIVERED || status === ServiceOrderStatus.CLOSED;
}

export function filterOrdersByTab(
  orders: readonly ServiceOrder[],
  tab: OrderFilterTab,
): readonly ServiceOrder[] {
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

export function countOrdersByTab(orders: readonly ServiceOrder[]): {
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
