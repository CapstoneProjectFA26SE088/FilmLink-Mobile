import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  filmLinkApi,
  filmLinkQueryKeys,
  ORDER_STALE_TIME_MS,
  type ServiceOrderSummaryResponse,
  SIGNED_URL_STALE_TIME_MS,
} from '@/shared/api';
import { authStore, type OrderActionDraft, OrderActionDraftSchema } from '@/shared/domain';
import { useDraftPersistence } from '@/shared/hooks';
import { useStore } from '@/shared/lib';
import {
  Alert,
  Button,
  Card,
  DraftRecoveryBanner,
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
  flattenPages,
  mapOrderApiError,
  type OrderFilterTab,
} from '../model/orders';
import { ArchiveSection } from './ArchiveSection';
import { OrderCardSection } from './OrderCardSection';

const INITIAL_ORDER_ACTION_DRAFT: OrderActionDraft = {
  activeOrderId: null,
  cancelReason: '',
};

function isOrderActionDraftEmpty(draft: OrderActionDraft): boolean {
  return draft.activeOrderId === null && draft.cancelReason.trim().length === 0;
}

function ActiveOrdersSection({
  displayedOrders,
  isLoading,
  isError,
  error,
  hasNextPage,
  isFetchingNextPage,
  hasRecoverableDraft,
  pendingRetry,
  lastErrorDetail,
  lastSavedAt,
  activeCancelOrderId,
  cancelReason,
  onRestoreDraft,
  onDiscardDraft,
  onRetry,
  onFetchNextPage,
  onOpenCancel,
  onCloseCancel,
  onChangeCancelReason,
  onCancelSuccess,
}: {
  readonly displayedOrders: readonly ServiceOrderSummaryResponse[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly hasRecoverableDraft: boolean;
  readonly pendingRetry: boolean;
  readonly lastErrorDetail: string | null;
  readonly lastSavedAt: string | null;
  readonly activeCancelOrderId: number | null;
  readonly cancelReason: string;
  readonly onRestoreDraft: () => void;
  readonly onDiscardDraft: () => void;
  readonly onRetry: () => void;
  readonly onFetchNextPage: () => void;
  readonly onOpenCancel: (orderId: number) => void;
  readonly onCloseCancel: () => void;
  readonly onChangeCancelReason: (reason: string) => void;
  readonly onCancelSuccess: () => void;
}) {
  return (
    <VStack gap="md">
      <DraftRecoveryBanner
        testID="orders.action.draft-recovery"
        visible={hasRecoverableDraft}
        pendingRetry={pendingRetry}
        lastErrorDetail={lastErrorDetail}
        lastSavedAt={lastSavedAt}
        onRestore={onRestoreDraft}
        onDiscard={onDiscardDraft}
      />

      {isLoading ? (
        <Card testID="orders.loading" tone="muted">
          <Text variant="secondary" tone="muted">
            Đang tải danh sách đơn hàng...
          </Text>
        </Card>
      ) : null}

      {isError ? (
        <VStack gap="sm">
          <Alert testID="orders.error" tone="danger" message={mapOrderApiError(error)} />
          <Button
            testID="orders.retry"
            label="Thử lại"
            variant="outline"
            size="sm"
            onPress={onRetry}
          />
        </VStack>
      ) : null}

      {!isLoading && !isError && displayedOrders.length === 0 ? (
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
        <OrderCardSection
          key={order.id}
          order={order}
          defaultExpanded={idx === 0}
          isCancelOpen={activeCancelOrderId === order.id}
          cancelReason={activeCancelOrderId === order.id ? cancelReason : ''}
          onOpenCancel={onOpenCancel}
          onCloseCancel={onCloseCancel}
          onChangeCancelReason={onChangeCancelReason}
          onCancelSuccess={onCancelSuccess}
        />
      ))}

      {hasNextPage ? (
        <Button
          testID="orders.load-more"
          label={isFetchingNextPage ? 'Đang tải thêm...' : 'Tải thêm đơn hàng'}
          variant="outline"
          size="md"
          loading={isFetchingNextPage}
          onPress={onFetchNextPage}
        />
      ) : null}
    </VStack>
  );
}

export function OrdersScreen() {
  const user = useStore(authStore, (state) => state.user);
  const isAuthenticated = useStore(authStore, (state) => state.isAuthenticated);
  const [filterTab, setFilterTab] = useState<OrderFilterTab>('active');
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);

  const {
    draft: actionDraft,
    hasRecoverableDraft,
    pendingRetry,
    lastErrorDetail,
    lastSavedAt,
    updateDraft: updateActionDraft,
    restoreDraft: restoreActionDraft,
    clearDraft: clearActionDraft,
  } = useDraftPersistence<OrderActionDraft>({
    flowKey: 'orders_action_draft',
    accountId: user?.id ?? null,
    schema: OrderActionDraftSchema,
    initialDraft: INITIAL_ORDER_ACTION_DRAFT,
    isEmpty: isOrderActionDraftEmpty,
  });

  const ordersQuery = useInfiniteQuery({
    queryKey: filmLinkQueryKeys.orders.list({ size: 20 }),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => filmLinkApi.fetchServiceOrders({ page: pageParam, size: 20 }),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    enabled: isAuthenticated,
    staleTime: ORDER_STALE_TIME_MS,
  });

  const archiveQuery = useInfiniteQuery({
    queryKey: filmLinkQueryKeys.archive.list({ size: 20 }),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => filmLinkApi.fetchFilmArchive({ page: pageParam, size: 20 }),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    enabled: isAuthenticated,
    staleTime: SIGNED_URL_STALE_TIME_MS,
  });

  const orders = flattenPages(ordersQuery.data?.pages);
  const archiveRolls = flattenPages(archiveQuery.data?.pages);
  const archiveTotal = archiveQuery.data?.pages[0]?.totalElements;
  const counts = countOrdersByTab(orders, archiveTotal);
  const displayedOrders = filterOrdersByTab(orders, filterTab);
  const activeCancelOrderId = cancellingOrderId ?? actionDraft.activeOrderId;

  const handleRestoreActionDraft = () => {
    const restored = restoreActionDraft();
    if (restored?.activeOrderId) {
      setCancellingOrderId(restored.activeOrderId);
    }
  };

  return (
    <Screen testID="orders.screen" scroll edges="top">
      <VStack gap="md">
        <VStack gap="none" className="pt-2">
          <Text variant="title">Đơn hàng & Lưu trữ số</Text>
          <Text variant="caption" tone="muted">
            Theo dõi tiến độ tráng scan 6 bước & Lưu trữ ảnh số
          </Text>
        </VStack>

        <SegmentedControl
          testIDPrefix="orders.filter"
          options={[
            { value: 'active', label: 'Đang xử lý', count: counts.active },
            { value: 'archive', label: 'Lưu trữ số', count: counts.archive },
            { value: 'all', label: 'Tất cả', count: counts.all },
          ]}
          value={filterTab}
          onChange={setFilterTab}
        />

        {filterTab !== 'archive' ? (
          <ActiveOrdersSection
            displayedOrders={displayedOrders}
            isLoading={isAuthenticated && ordersQuery.isLoading}
            isError={ordersQuery.isError}
            error={ordersQuery.error}
            hasNextPage={Boolean(ordersQuery.hasNextPage)}
            isFetchingNextPage={ordersQuery.isFetchingNextPage}
            hasRecoverableDraft={hasRecoverableDraft}
            pendingRetry={pendingRetry}
            lastErrorDetail={lastErrorDetail}
            lastSavedAt={lastSavedAt}
            activeCancelOrderId={activeCancelOrderId}
            cancelReason={actionDraft.cancelReason}
            onRestoreDraft={handleRestoreActionDraft}
            onDiscardDraft={() => void clearActionDraft()}
            onRetry={() => void ordersQuery.refetch()}
            onFetchNextPage={() => void ordersQuery.fetchNextPage()}
            onOpenCancel={(orderId) => {
              setCancellingOrderId(orderId);
              updateActionDraft((prev) => ({
                activeOrderId: orderId,
                cancelReason: prev.activeOrderId === orderId ? prev.cancelReason : '',
              }));
            }}
            onCloseCancel={() => {
              setCancellingOrderId(null);
              void clearActionDraft();
            }}
            onChangeCancelReason={(cancelReason) => {
              updateActionDraft({ activeOrderId: activeCancelOrderId, cancelReason });
            }}
            onCancelSuccess={() => {
              setCancellingOrderId(null);
              void clearActionDraft();
            }}
          />
        ) : (
          <ArchiveSection
            rolls={archiveRolls}
            isLoading={isAuthenticated && archiveQuery.isLoading}
            isFetchingNextPage={archiveQuery.isFetchingNextPage}
            hasNextPage={Boolean(archiveQuery.hasNextPage)}
            error={archiveQuery.error}
            onRetry={() => void archiveQuery.refetch()}
            onLoadMore={() => void archiveQuery.fetchNextPage()}
            onGoServices={() => router.push('/(tabs)/services')}
          />
        )}
      </VStack>
    </Screen>
  );
}
