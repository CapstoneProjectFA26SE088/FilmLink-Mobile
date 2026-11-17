import { router } from 'expo-router';
import { useState } from 'react';
import { authStore, checkRoleCapabilities, filmLinkStore, Role } from '@/shared/domain';
import { useStore } from '@/shared/lib';
import { AppHeader, EmptyState, Screen, SegmentedControl, VStack } from '@/shared/ui';
import { countOrdersByTab, filterOrdersByTab, type OrderFilterTab } from '../model/orders';
import { OrderCardSection } from './OrderCardSection';

export function OrdersScreen() {
  const orders = useStore(filmLinkStore, (state) => state.orders);
  const userRole = useStore(authStore, (state) => state.user?.role ?? Role.PHOTOGRAPHER);
  const { isExpert } = checkRoleCapabilities(userRole);
  const [filterTab, setFilterTab] = useState<OrderFilterTab>('active');

  const counts = countOrdersByTab(orders);
  const displayedOrders = filterOrdersByTab(orders, filterTab);

  return (
    <Screen
      testID="orders.screen"
      scroll
      edges="top"
      header={
        <AppHeader
          title="Đơn hàng & Lưu trữ số"
          subtitle="Theo dõi 6 bước tráng scan (BR-07) & Tải file gốc (BR-08)"
          isExpert={isExpert}
        />
      }
    >
      <VStack gap="md">
        <SegmentedControl
          testIDPrefix="orders.filter"
          options={[
            { value: 'active', label: 'Đang xử lý', count: counts.active },
            { value: 'completed', label: 'Lưu trữ số', count: counts.completed },
            { value: 'all', label: 'Tất cả', count: counts.all },
          ]}
          value={filterTab}
          onChange={setFilterTab}
        />

        {displayedOrders.length === 0 ? (
          <EmptyState
            testID="orders.empty"
            actionTestID="orders.go-services"
            title="Chưa có đơn hàng nào trong mục này"
            description="Đặt lịch tráng & scan tại các Phòng Lab đối tác để theo dõi trực tuyến."
            actionLabel="Đặt tráng phim ngay"
            onAction={() => router.push('/(tabs)/services')}
          />
        ) : (
          displayedOrders.map((order, idx) => (
            <OrderCardSection key={order.id} order={order} defaultExpanded={idx === 0} />
          ))
        )}
      </VStack>
    </Screen>
  );
}
