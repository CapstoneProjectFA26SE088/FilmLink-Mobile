import { useMutation, useQuery } from '@tanstack/react-query';
import { openURL } from 'expo-linking';
import { useState } from 'react';
import {
  type FilmRollResponse,
  filmLinkApi,
  filmLinkQueryKeys,
  type OrderHandoverResponse,
  type ServiceOrderDetailResponse,
  type ServiceOrderSummaryResponse,
  SIGNED_URL_STALE_TIME_MS,
} from '@/shared/api';
import {
  FILM_ROLL_STATUS_LABELS,
  HANDOVER_POINT_LABELS,
  SERVICE_ORDER_STATUS_LABELS,
  ServiceOrderStatus,
} from '@/shared/domain';
import { formatDateTimeVn, formatDateVn, formatVnd } from '@/shared/lib';
import {
  Alert,
  Badge,
  type BadgeTone,
  Button,
  Card,
  HStack,
  Icon,
  MediaImage,
  Text,
  VStack,
} from '@/shared/ui';
import {
  buildOrderStageTimeline,
  computeOrderProgressPct,
  isSignedUrlExpiredError,
  mapOrderApiError,
  type OrderStageTimelineItem,
} from '../model/orders';

function resolveStatusBadgeTone(status: ServiceOrderStatus): BadgeTone {
  if (status === ServiceOrderStatus.DELIVERED || status === ServiceOrderStatus.CLOSED) {
    return 'success';
  }
  if (status === ServiceOrderStatus.CANCELLED || status === ServiceOrderStatus.SUSPENDED) {
    return 'danger';
  }
  if (
    status === ServiceOrderStatus.AWAITING_PAYMENT ||
    status === ServiceOrderStatus.AWAITING_TOP_UP
  ) {
    return 'warning';
  }
  return 'brand';
}

function OrderTimelineSection({
  timeline,
}: {
  readonly timeline: readonly OrderStageTimelineItem[];
}) {
  return (
    <VStack gap="xs">
      {timeline.map((step) => {
        const iconName = step.isDone
          ? 'checkmark-circle'
          : step.isCurrent
            ? 'ellipse'
            : 'ellipse-outline';
        const tone = step.isCurrent ? 'brand' : step.isDone ? 'success' : 'muted';
        return (
          <HStack key={step.stage} justify="between" align="center" gap="sm">
            <HStack gap="xs" align="center" className="flex-1">
              <Icon name={iconName} size="xs" tone={tone} />
              <VStack gap="none" className="flex-1">
                <Text variant="caption" tone={tone}>
                  {step.label}
                </Text>
                {step.note ? (
                  <Text variant="caption" tone="muted">
                    {step.note}
                  </Text>
                ) : null}
              </VStack>
            </HStack>
            {step.recordedAt ? (
              <Text variant="caption" tone="muted">
                {formatDateVn(step.recordedAt)}
              </Text>
            ) : null}
          </HStack>
        );
      })}
    </VStack>
  );
}

function OrderRollsSection({ rolls }: { readonly rolls: readonly FilmRollResponse[] }) {
  if (rolls.length === 0) {
    return null;
  }
  return (
    <Card tone="muted">
      <VStack gap="xs">
        <Text variant="secondary">Chi tiết cuộn phim ({rolls.length})</Text>
        {rolls.map((roll) => {
          const stockLabel = roll.filmStockNameText ?? `Danh mục #${roll.filmStockId ?? '-'}`;
          const stopsLabel =
            roll.pushPullStops > 0 ? `+${roll.pushPullStops}` : String(roll.pushPullStops);
          return (
            <HStack key={roll.id} justify="between" align="center" gap="sm">
              <VStack gap="none" className="flex-1">
                <Text variant="caption">
                  Cuộn #{roll.rollSequence} · {stockLabel}
                </Text>
                <Text variant="caption" tone="muted">
                  {roll.exposureCount} kiểu · ISO {roll.shootingIso ?? 'Mặc định'} · Push/Pull{' '}
                  {stopsLabel}
                </Text>
              </VStack>
              <Badge label={FILM_ROLL_STATUS_LABELS[roll.status]} tone="neutral" />
            </HStack>
          );
        })}
      </VStack>
    </Card>
  );
}

function OrderHandoversSection({
  orderId,
  handovers,
  onRefreshSignedUrls,
}: {
  readonly orderId: number;
  readonly handovers: readonly OrderHandoverResponse[];
  readonly onRefreshSignedUrls: () => void;
}) {
  if (handovers.length === 0) {
    return null;
  }
  const hasPhotos = handovers.some((handover) => handover.photos.length > 0);

  return (
    <Card tone="muted">
      <VStack gap="sm">
        <HStack justify="between" align="center">
          <Text variant="secondary">Biên bản & Ảnh bàn giao ({handovers.length})</Text>
          {hasPhotos ? (
            <Button
              testID={`orders.refresh-photos.${orderId}`}
              label="Làm mới ảnh"
              size="sm"
              variant="ghost"
              onPress={onRefreshSignedUrls}
            />
          ) : null}
        </HStack>
        {handovers.map((handover) => {
          const sortedPhotos = [...handover.photos].sort((a, b) => a.displayOrder - b.displayOrder);
          return (
            <VStack key={handover.id} gap="xs">
              <Text variant="caption">
                {HANDOVER_POINT_LABELS[handover.handoverPoint]} · {handover.rollCount} cuộn ·{' '}
                {formatDateTimeVn(handover.occurredAt)}
              </Text>
              {handover.note ? (
                <Text variant="caption" tone="muted">
                  {handover.note}
                </Text>
              ) : null}
              {sortedPhotos.map((photo) => (
                <MediaImage
                  key={photo.id}
                  uri={photo.url}
                  accessibilityLabel={`Ảnh bàn giao ${handover.id}-${photo.id}`}
                />
              ))}
            </VStack>
          );
        })}
      </VStack>
    </Card>
  );
}

function OrderDetailContent({
  orderId,
  detail,
  onRefreshSignedUrls,
}: {
  readonly orderId: number;
  readonly detail: ServiceOrderDetailResponse;
  readonly onRefreshSignedUrls: () => void;
}) {
  const timeline = buildOrderStageTimeline(detail.stages);
  const progressPct = computeOrderProgressPct(detail.status, detail.stages);

  return (
    <VStack gap="sm">
      <HStack justify="between" align="center">
        <Text variant="secondary">Tiến độ xử lý</Text>
        <Badge label={`${progressPct}%`} tone={progressPct === 100 ? 'success' : 'info'} />
      </HStack>
      <OrderTimelineSection timeline={timeline} />
      <OrderRollsSection rolls={detail.rolls} />
      <OrderHandoversSection
        orderId={orderId}
        handovers={detail.handovers}
        onRefreshSignedUrls={onRefreshSignedUrls}
      />
    </VStack>
  );
}

function OrderPaymentSection({
  orderId,
  amountVnd,
  onPaySuccess,
  onResetNotice,
  paymentNotice,
}: {
  readonly orderId: number;
  readonly amountVnd: number;
  readonly onPaySuccess: () => void;
  readonly onResetNotice: () => void;
  readonly paymentNotice: string | null;
}) {
  const vnpayMutation = useMutation({
    mutationFn: (payload: Parameters<typeof filmLinkApi.createVnpaySandboxUrl>[0]) =>
      filmLinkApi.createVnpaySandboxUrl(payload),
  });

  const handlePayVnpay = async () => {
    onResetNotice();
    try {
      const response = await vnpayMutation.mutateAsync({
        amountVnd: Math.max(10_000, amountVnd),
        locale: 'vn',
      });
      await openURL(response.paymentUrl).catch(() => undefined);
      onPaySuccess();
    } catch {
      onResetNotice();
    }
  };

  return (
    <VStack gap="xs">
      <Button
        testID={`orders.pay.${orderId}`}
        label={vnpayMutation.isPending ? 'Đang kết nối VNPay...' : 'Thanh toán VNPay Sandbox'}
        size="sm"
        variant="primary"
        loading={vnpayMutation.isPending}
        onPress={() => void handlePayVnpay()}
      />
      {vnpayMutation.isError ? (
        <Alert
          testID={`orders.pay-error.${orderId}`}
          tone="danger"
          message={mapOrderApiError(vnpayMutation.error)}
        />
      ) : null}
      {paymentNotice ? (
        <Alert testID={`orders.pay-notice.${orderId}`} tone="info" message={paymentNotice} />
      ) : null}
    </VStack>
  );
}

function OrderExpandedSection({
  orderId,
  isLoading,
  error,
  detail,
  onRetry,
}: {
  readonly orderId: number;
  readonly isLoading: boolean;
  readonly error: unknown;
  readonly detail: ServiceOrderDetailResponse | undefined;
  readonly onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <Text variant="caption" tone="muted">
        Đang tải chi tiết đơn hàng...
      </Text>
    );
  }
  if (error) {
    return (
      <VStack gap="xs">
        <Alert
          testID={`orders.detail-error.${orderId}`}
          tone="danger"
          message={mapOrderApiError(error)}
        />
        <Button
          testID={`orders.detail-retry.${orderId}`}
          label={isSignedUrlExpiredError(error) ? 'Làm mới liên kết ảnh' : 'Thử lại'}
          size="sm"
          variant="outline"
          onPress={onRetry}
        />
      </VStack>
    );
  }
  if (!detail) {
    return null;
  }
  return <OrderDetailContent orderId={orderId} detail={detail} onRefreshSignedUrls={onRetry} />;
}

export function OrderCardSection({
  order,
  defaultExpanded,
}: {
  readonly order: ServiceOrderSummaryResponse;
  readonly defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: filmLinkQueryKeys.orders.detail(order.id),
    queryFn: () => filmLinkApi.fetchServiceOrderDetail(order.id),
    enabled: expanded,
    staleTime: SIGNED_URL_STALE_TIME_MS,
  });

  const displayAmount = order.finalTotalVnd ?? order.estimatedTotalVnd;
  const returnAt = order.promisedReturnAt ?? order.expectedReturnAt;

  return (
    <Card>
      <VStack gap="sm">
        <HStack justify="between" align="center" gap="sm">
          <VStack gap="none" className="flex-1">
            <Text variant="heading">{order.orderCode}</Text>
            <Text variant="caption" tone="muted">
              {order.labName} · {order.rollCount} cuộn phim
            </Text>
          </VStack>
          <Badge
            label={SERVICE_ORDER_STATUS_LABELS[order.status]}
            tone={resolveStatusBadgeTone(order.status)}
          />
        </HStack>

        <HStack justify="between" align="center">
          <Text variant="caption" tone="secondary">
            Hẹn trả {formatDateVn(returnAt)}
          </Text>
          <Text variant="secondary" tone="brand">
            {formatVnd(displayAmount)}
          </Text>
        </HStack>

        {order.status === ServiceOrderStatus.AWAITING_PAYMENT ? (
          <OrderPaymentSection
            orderId={order.id}
            amountVnd={displayAmount}
            paymentNotice={paymentNotice}
            onResetNotice={() => setPaymentNotice(null)}
            onPaySuccess={() => setPaymentNotice('Đã mở cổng thanh toán VNPay Sandbox.')}
          />
        ) : null}

        <Button
          testID={`orders.toggle.${order.id}`}
          label={expanded ? 'Thu gọn chi tiết' : 'Xem tiến độ & Ảnh bàn giao'}
          size="sm"
          variant="outline"
          onPress={() => setExpanded((prev) => !prev)}
        />

        {expanded ? (
          <OrderExpandedSection
            orderId={order.id}
            isLoading={detailQuery.isLoading}
            error={detailQuery.error}
            detail={detailQuery.data}
            onRetry={() => void detailQuery.refetch()}
          />
        ) : null}
      </VStack>
    </Card>
  );
}
