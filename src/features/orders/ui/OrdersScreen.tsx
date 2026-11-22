import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { filmLinkApi, filmLinkQueryKeys, ORDER_STALE_TIME_MS } from '@/shared/api';
import { authStore } from '@/shared/domain';
import { useStore } from '@/shared/lib';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Icon,
  Screen,
  SegmentedControl,
  Text,
  VStack,
} from '@/shared/ui';
import {
  countOrdersByTab,
  filterOrdersByTab,
  mapOrderApiError,
  type OrderFilterTab,
} from '../model/orders';
import { OrderCardSection } from './OrderCardSection';

export function OrdersScreen() {
  const isAuthenticated = useStore(authStore, (state) => state.isAuthenticated);
  const [filterTab, setFilterTab] = useState<OrderFilterTab>('active');

  const ordersQuery = useQuery({
    queryKey: filmLinkQueryKeys.orders.list({ size: 50 }),
    queryFn: () => filmLinkApi.fetchServiceOrders({ size: 50 }),
    enabled: isAuthenticated,
    staleTime: ORDER_STALE_TIME_MS,
  });

  const orders = ordersQuery.data?.content ?? [];
  const counts = countOrdersByTab(orders);
  const displayedOrders = filterOrdersByTab(orders, filterTab);
  const isLoading = isAuthenticated && ordersQuery.isLoading;

  return (
    <Screen testID="orders.screen" scroll edges="top">
      <VStack gap="md">
        <VStack gap="none" className="pt-2">
          <Text variant="title">Đơn hàng & Lưu trữ số</Text>
          <Text variant="caption" tone="muted">
            Theo dõi tiến độ tráng scan 6 bước & Ảnh bàn giao
          </Text>
        </VStack>

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

        {isLoading ? (
          <Card testID="orders.loading" tone="muted">
            <Text variant="secondary" tone="muted">
              Đang tải danh sách đơn hàng...
            </Text>
          </Card>
        ) : null}

        {ordersQuery.isError ? (
          <VStack gap="sm">
            <Alert
              testID="orders.error"
              tone="danger"
              message={mapOrderApiError(ordersQuery.error)}
            />
            <Button
              testID="orders.retry"
              label="Thử lại"
              variant="outline"
              size="sm"
              onPress={() => void ordersQuery.refetch()}
            />
          </VStack>
        ) : null}

        {!isLoading && !ordersQuery.isError && displayedOrders.length === 0 ? (
          <EmptyState
            testID="orders.empty"
            actionTestID="orders.go-services"
            title="Chưa có đơn hàng nào trong mục này"
            description="Đặt lịch tráng & scan tại các Phòng Lab đối tác để theo dõi trực tuyến."
            actionLabel="Đặt tráng phim ngay"
            icon={<Icon name="receipt-outline" size="xl" tone="muted" />}
            onAction={() => router.push('/(tabs)/services')}
          />
        ) : null}

        {displayedOrders.map((order, idx) => (
          <OrderCardSection key={order.id} order={order} defaultExpanded={idx === 0} />
        ))}
      </VStack>
    </Screen>
  );
}
