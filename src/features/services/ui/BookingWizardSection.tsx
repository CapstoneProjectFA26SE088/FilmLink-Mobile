import { useState } from 'react';
import {
  type BookingDraft,
  BookingDraftSchema,
  calculateBookingPricing,
  createServiceOrder,
  draftStore,
  HANDOVER_OPTIONS,
  POPULAR_FILM_STOCKS,
  resetBookingDraft,
  updateBookingDraft,
} from '@/shared/domain';
import { useDraftPersistence } from '@/shared/hooks';
import { formatVnd, useStore } from '@/shared/lib';
import {
  Badge,
  Button,
  Card,
  DraftRecoveryBanner,
  FilterChipGroup,
  HStack,
  Icon,
  Input,
  Text,
  VStack,
} from '@/shared/ui';
import { clampPushPullStops, clampRollCount } from '../model/services';

export function BookingWizardSection({ onOrderCreated }: { readonly onOrderCreated: () => void }) {
  const draft = useStore(draftStore, (state) => state.bookingDraft);
  const [error, setError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const {
    hasRecoverableDraft,
    pendingRetry,
    lastErrorDetail,
    lastSavedAt,
    restoreDraft,
    clearDraft,
  } = useDraftPersistence<BookingDraft>({
    flowKey: 'services_booking_wizard',
    schema: BookingDraftSchema,
    initialDraft: draft,
    isEmpty: (d) => !d.filmStock.trim(),
  });

  const pricing = calculateBookingPricing(draft.unitPrice, draft.rollCount, draft.pushPullStops);

  const handleRestoreDraft = () => {
    restoreDraft();
  };

  const handleSubmit = () => {
    try {
      const order = createServiceOrder({
        ...draft,
        unitPrice: pricing.effectiveUnitPrice,
      });
      setError(null);
      setCreatedOrderId(order.id);
      void clearDraft();
      resetBookingDraft();
      onOrderCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo đơn hàng.');
    }
  };

  return (
    <VStack gap="md">
      <DraftRecoveryBanner
        testID="services.booking.draft-recovery"
        visible={hasRecoverableDraft}
        pendingRetry={pendingRetry}
        lastErrorDetail={lastErrorDetail}
        lastSavedAt={lastSavedAt}
        onRestore={handleRestoreDraft}
        onDiscard={() => void clearDraft()}
      />

      {createdOrderId ? (
        <Card tone="success">
          <Text variant="secondary" tone="success">
            Đã tạo đơn hàng {createdOrderId} thành công!
          </Text>
        </Card>
      ) : null}

      <Card tone="brand">
        <VStack gap="xs">
          <Badge label={`${draft.filmProcess} · ${draft.filmFormat}`} tone="brand" />
          <Text variant="heading">{draft.labName}</Text>
          <Text variant="secondary" tone="secondary">
            {draft.packageName} · Đơn giá {formatVnd(draft.unitPrice)}/cuộn
          </Text>
        </VStack>
      </Card>

      <Card>
        <VStack gap="md">
          <Input
            testID="services.booking.film-stock"
            label="Tên cuộn phim (Film Stock)"
            value={draft.filmStock}
            onChangeText={(text) => {
              setError(null);
              updateBookingDraft({ filmStock: text });
            }}
            placeholder="Kodak Portra 400"
            icon={<Icon name="camera-outline" size="sm" tone="muted" />}
          />

          <FilterChipGroup
            testIDPrefix="services.booking.stock"
            label="Chọn nhanh phim phổ biến"
            options={POPULAR_FILM_STOCKS.map((stock) => ({ value: stock, label: stock }))}
            value={draft.filmStock}
            onChange={(filmStock) => updateBookingDraft({ filmStock })}
            scrollable
          />

          <HStack justify="between" align="center" className="py-1">
            <VStack gap="none">
              <Text variant="secondary">Số lượng cuộn</Text>
              <Text variant="caption" tone="muted">
                Tối đa 20 cuộn/đơn
              </Text>
            </VStack>
            <HStack gap="sm" align="center">
              <Button
                testID="services.booking.rolls-dec"
                label="-"
                size="sm"
                variant="outline"
                className="w-11"
                onPress={() =>
                  updateBookingDraft({ rollCount: clampRollCount(draft.rollCount, -1) })
                }
              />
              <Text variant="heading" className="w-8 text-center">
                {draft.rollCount}
              </Text>
              <Button
                testID="services.booking.rolls-inc"
                label="+"
                size="sm"
                variant="outline"
                className="w-11"
                onPress={() =>
                  updateBookingDraft({ rollCount: clampRollCount(draft.rollCount, 1) })
                }
              />
            </HStack>
          </HStack>

          <HStack justify="between" align="center" className="py-1">
            <VStack gap="none">
              <Text variant="secondary">Push / Pull (Stops)</Text>
              <Text variant="caption" tone="muted">
                +20.000 ₫ / stop / cuộn
              </Text>
            </VStack>
            <HStack gap="sm" align="center">
              <Button
                testID="services.booking.stops-dec"
                label="-"
                size="sm"
                variant="outline"
                className="w-11"
                onPress={() =>
                  updateBookingDraft({ pushPullStops: clampPushPullStops(draft.pushPullStops, -1) })
                }
              />
              <Text variant="heading" className="w-8 text-center">
                {draft.pushPullStops > 0 ? `+${draft.pushPullStops}` : draft.pushPullStops}
              </Text>
              <Button
                testID="services.booking.stops-inc"
                label="+"
                size="sm"
                variant="outline"
                className="w-11"
                onPress={() =>
                  updateBookingDraft({ pushPullStops: clampPushPullStops(draft.pushPullStops, 1) })
                }
              />
            </HStack>
          </HStack>

          <FilterChipGroup
            testIDPrefix="services.booking.handover"
            label="Phương thức bàn giao phim"
            options={HANDOVER_OPTIONS}
            value={draft.handoverMethod}
            onChange={(handoverMethod) => updateBookingDraft({ handoverMethod })}
          />

          <Input
            testID="services.booking.note"
            label="Ghi chú kỹ thuật viên"
            value={draft.note}
            onChangeText={(note) => updateBookingDraft({ note })}
            placeholder="Ví dụ: giữ nguyên vỏ cuộn, ưu tiên tone da tự nhiên..."
            icon={<Icon name="document-text-outline" size="sm" tone="muted" />}
          />

          <Card tone="muted">
            <VStack gap="xs">
              <HStack justify="between">
                <Text variant="caption" tone="secondary">
                  Phí tráng cơ bản
                </Text>
                <Text variant="caption">{formatVnd(pricing.baseAmount)}</Text>
              </HStack>
              <HStack justify="between">
                <Text variant="caption" tone="secondary">
                  Phụ thu Push/Pull
                </Text>
                <Text variant="caption">{formatVnd(pricing.pushPullFee)}</Text>
              </HStack>
              <HStack justify="between" align="center" className="pt-1 border-t border-border">
                <Text variant="heading">Tổng thanh toán</Text>
                <Text variant="title" tone="brand">
                  {formatVnd(pricing.totalPrice)}
                </Text>
              </HStack>
            </VStack>
          </Card>

          {error ? (
            <Text variant="caption" tone="danger">
              {error}
            </Text>
          ) : null}

          <Button
            testID="services.booking.submit"
            label="Xác nhận đặt tráng & scan"
            variant="primary"
            size="lg"
            onPress={handleSubmit}
          />
        </VStack>
      </Card>
    </VStack>
  );
}
