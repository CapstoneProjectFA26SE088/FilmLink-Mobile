import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  CATALOG_STALE_TIME_MS,
  filmLinkApi,
  filmLinkQueryKeys,
  type PublicFilmLabResponse,
  type PublicServicePackage,
  type ServiceOrderQuoteResponse,
  SubmitServiceOrderRequestSchema,
} from '@/shared/api';
import {
  authStore,
  HANDOVER_METHOD_LABELS,
  HandoverMethod,
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
  validateServiceOrderRequestInput,
} from '@/shared/domain';
import { useDraftPersistence } from '@/shared/hooks';
import { formatDateTimeVn, formatVnd, useStore } from '@/shared/lib';
import {
  Alert,
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
import {
  addBookingRoll,
  buildLiveOrderPayload,
  buildPickupWindowRange,
  buildSubmitOrderPayload,
  createBookingRollDraft,
  duplicateBookingRoll,
  type LiveBookingDraft,
  LiveBookingDraftSchema,
  type LiveBookingInput,
  type LiveBookingRollDraft,
  mapServiceApiError,
  removeBookingRoll,
  resolveRollPackage,
  resolveScanOptionId,
  updateBookingRoll,
} from '../model/services';
import { BookingRollEditorCard } from './BookingRollCardSection';

export type BookingWizardSectionProps = {
  readonly selectedLab: PublicFilmLabResponse | null;
  readonly selectedPackage: PublicServicePackage | null;
  readonly onChooseLab: () => void;
  readonly onOrderCreated: () => void;
};

const INITIAL_LIVE_BOOKING_DRAFT: LiveBookingDraft = {
  paymentMethod: PaymentMethod.PAY_AT_LAB,
  rolls: [createBookingRollDraft(null)],
  handoverMethod: HandoverMethod.SELF_DROP_OFF,
  specialRequest: '',
  customerAddressLine: '',
  customerDistrict: '',
  customerProvince: '',
  customerPhone: '',
  pickupWindowStartAt: '',
  pickupWindowEndAt: '',
};

const LIVE_HANDOVER_OPTIONS = [
  {
    value: HandoverMethod.SELF_DROP_OFF,
    label: HANDOVER_METHOD_LABELS[HandoverMethod.SELF_DROP_OFF],
  },
  {
    value: HandoverMethod.PICKUP,
    label: HANDOVER_METHOD_LABELS[HandoverMethod.PICKUP],
  },
] as const;

const LIVE_PAYMENT_OPTIONS = [
  {
    value: PaymentMethod.PAY_AT_LAB,
    label: PAYMENT_METHOD_LABELS[PaymentMethod.PAY_AT_LAB],
  },
  {
    value: PaymentMethod.ONLINE,
    label: PAYMENT_METHOD_LABELS[PaymentMethod.ONLINE],
  },
] as const;

function isBookingDraftEmpty(draft: LiveBookingDraft): boolean {
  const firstRoll = draft.rolls[0];
  if (!firstRoll) {
    return false;
  }
  return (
    draft.rolls.length === 1 &&
    firstRoll.filmStockId === null &&
    !firstRoll.filmStockNameText.trim() &&
    !draft.specialRequest.trim() &&
    draft.paymentMethod === PaymentMethod.PAY_AT_LAB
  );
}

function buildBookingInputFromDraft(
  selectedLab: PublicFilmLabResponse,
  selectedPackage: PublicServicePackage,
  draft: LiveBookingDraft,
): LiveBookingInput {
  const rolls = draft.rolls.map((roll) => {
    const pkg =
      resolveRollPackage(selectedLab, roll.servicePackageId, selectedPackage) ?? selectedPackage;
    return {
      servicePackageId: pkg.id,
      filmFormatId: pkg.filmFormat.id,
      servicePackageScanOptionId: resolveScanOptionId(pkg, roll.scanOptionId),
      filmStockId: roll.filmStockId,
      filmStockNameText: roll.filmStockId ? null : roll.filmStockNameText,
      exposureCount: roll.exposureCount,
      shootingIso: roll.shootingIso,
      pushPullStops: pkg.pushPullAvailable ? roll.pushPullStops : 0,
    };
  });

  return {
    filmLabId: selectedLab.id,
    paymentMethod: draft.paymentMethod,
    rolls,
    filmHandoverMethod: draft.handoverMethod,
    specialRequest: draft.specialRequest,
    customerAddressLine: draft.customerAddressLine,
    customerDistrict: draft.customerDistrict,
    customerProvince: draft.customerProvince,
    customerPhone: draft.customerPhone,
    pickupWindowStartAt: draft.pickupWindowStartAt,
    pickupWindowEndAt: draft.pickupWindowEndAt,
  };
}

function validateLiveBookingInput(input: LiveBookingInput): string | null {
  const payload = buildLiveOrderPayload(input);
  return validateServiceOrderRequestInput({
    filmLabId: payload.filmLabId,
    serviceTier: payload.serviceTier,
    filmHandoverMethod: payload.filmHandoverMethod,
    paymentMethod: payload.paymentMethod,
    specialRequest: payload.specialRequest,
    customerAddressLine: payload.customerAddressLine,
    customerDistrict: payload.customerDistrict,
    customerProvince: payload.customerProvince,
    customerPhone: payload.customerPhone,
    pickupWindowStartAt: payload.pickupWindowStartAt,
    pickupWindowEndAt: payload.pickupWindowEndAt,
    rolls: payload.rolls.map((roll) => ({
      filmStockId: roll.filmStockId,
      filmStockNameText: roll.filmStockNameText,
      filmFormatId: roll.filmFormatId,
      exposureCount: roll.exposureCount,
      shootingIso: roll.shootingIso ?? 400,
      servicePackageId: roll.servicePackageId,
      pushPullStops: roll.pushPullStops ?? 0,
    })),
  });
}

function PickupFieldsSection({
  draft,
  onUpdateDraft,
}: {
  readonly draft: LiveBookingDraft;
  readonly onUpdateDraft: (updater: (prev: LiveBookingDraft) => LiveBookingDraft) => void;
}) {
  return (
    <Card tone="muted">
      <VStack gap="sm">
        <Text variant="secondary">Thông tin lấy phim tận nơi</Text>
        <Input
          testID="services.booking.pickup-address"
          label="Địa chỉ nhận phim"
          required
          value={draft.customerAddressLine}
          onChangeText={(customerAddressLine) =>
            onUpdateDraft((prev) => ({ ...prev, customerAddressLine }))
          }
          placeholder="42 Nguyễn Huệ"
        />
        <Input
          testID="services.booking.pickup-district"
          label="Quận / Huyện"
          required
          value={draft.customerDistrict}
          onChangeText={(customerDistrict) =>
            onUpdateDraft((prev) => ({ ...prev, customerDistrict }))
          }
          placeholder="Quận 1"
        />
        <Input
          testID="services.booking.pickup-province"
          label="Tỉnh / Thành phố"
          required
          value={draft.customerProvince}
          onChangeText={(customerProvince) =>
            onUpdateDraft((prev) => ({ ...prev, customerProvince }))
          }
          placeholder="TP.HCM"
        />
        <Input
          testID="services.booking.pickup-phone"
          label="Số điện thoại liên hệ"
          required
          value={draft.customerPhone}
          onChangeText={(customerPhone) => onUpdateDraft((prev) => ({ ...prev, customerPhone }))}
          keyboardType="phone-pad"
          placeholder="0908123456"
        />
        <FilterChipGroup
          testIDPrefix="services.booking.pickup-preset"
          label="Chọn nhanh khung giờ lấy phim"
          options={[
            { value: 'MORNING', label: 'Sáng mai (09:00–12:00)' },
            { value: 'AFTERNOON', label: 'Chiều mai (14:00–17:00)' },
          ]}
          value=""
          onChange={(preset) => {
            const range = buildPickupWindowRange(preset === 'AFTERNOON' ? 'AFTERNOON' : 'MORNING');
            onUpdateDraft((prev) => ({
              ...prev,
              pickupWindowStartAt: range.startAt,
              pickupWindowEndAt: range.endAt,
            }));
          }}
        />
        <Input
          testID="services.booking.pickup-start"
          label="Thời gian bắt đầu (ISO)"
          value={draft.pickupWindowStartAt}
          onChangeText={(pickupWindowStartAt) =>
            onUpdateDraft((prev) => ({ ...prev, pickupWindowStartAt }))
          }
          autoCapitalize="none"
          placeholder="2026-11-23T09:00:00+07:00"
        />
        <Input
          testID="services.booking.pickup-end"
          label="Thời gian kết thúc (ISO)"
          value={draft.pickupWindowEndAt}
          onChangeText={(pickupWindowEndAt) =>
            onUpdateDraft((prev) => ({ ...prev, pickupWindowEndAt }))
          }
          autoCapitalize="none"
          placeholder="2026-11-23T12:00:00+07:00"
        />
      </VStack>
    </Card>
  );
}

function QuoteSummaryCard({ quote }: { readonly quote: ServiceOrderQuoteResponse }) {
  return (
    <Card testID="services.booking.quote-summary" tone="muted">
      <VStack gap="xs">
        <HStack justify="between">
          <Text variant="caption" tone="secondary">
            Tạm tính ({quote.rolls.length} cuộn)
          </Text>
          <Text variant="caption">{formatVnd(quote.subtotalVnd)}</Text>
        </HStack>
        <HStack justify="between">
          <Text variant="caption" tone="secondary">
            Phí giao nhận
          </Text>
          <Text variant="caption">{formatVnd(quote.deliveryFeeVnd)}</Text>
        </HStack>
        <HStack justify="between" align="center" className="pt-1 border-t border-border">
          <Text variant="heading">Tổng ước tính</Text>
          <Text variant="title" tone="brand">
            {formatVnd(quote.estimatedTotalVnd)}
          </Text>
        </HStack>
        <Text variant="caption" tone="muted">
          Dự kiến trả: {formatDateTimeVn(quote.expectedReturnAt)}
        </Text>
      </VStack>
    </Card>
  );
}

export function BookingWizardSection({
  selectedLab,
  selectedPackage,
  onChooseLab,
  onOrderCreated,
}: BookingWizardSectionProps) {
  const queryClient = useQueryClient();
  const accountId = useStore(authStore, (state) => state.user?.id ?? null);
  const [stockSearch, setStockSearch] = useState('');
  const [activeRollIndex, setActiveRollIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const {
    draft,
    idempotencyKey,
    hasRecoverableDraft,
    pendingRetry,
    lastErrorDetail,
    lastSavedAt,
    updateDraft,
    restoreDraft,
    markSubmissionFailed,
    clearDraft,
  } = useDraftPersistence<LiveBookingDraft>({
    flowKey: 'services_booking_wizard',
    accountId,
    schema: LiveBookingDraftSchema,
    initialDraft: INITIAL_LIVE_BOOKING_DRAFT,
    isEmpty: isBookingDraftEmpty,
  });

  const stocksQuery = useQuery({
    queryKey: filmLinkQueryKeys.catalogs.stocks(stockSearch),
    queryFn: () => filmLinkApi.searchFilmStocks(stockSearch),
    staleTime: CATALOG_STALE_TIME_MS,
  });

  const quoteMutation = useMutation({
    mutationFn: (payload: Parameters<typeof filmLinkApi.quoteServiceOrder>[0]) =>
      filmLinkApi.quoteServiceOrder(payload),
  });

  const submitMutation = useMutation({
    mutationFn: (payload: Parameters<typeof filmLinkApi.createServiceOrderRequest>[0]) =>
      filmLinkApi.createServiceOrderRequest(payload),
  });

  if (!selectedLab || !selectedPackage) {
    return (
      <VStack gap="md">
        <DraftRecoveryBanner
          testID="services.booking.draft-recovery"
          visible={hasRecoverableDraft}
          pendingRetry={pendingRetry}
          lastErrorDetail={lastErrorDetail}
          lastSavedAt={lastSavedAt}
          onRestore={restoreDraft}
          onDiscard={() => void clearDraft()}
        />
        <Card tone="muted">
          <VStack gap="sm">
            <Text variant="heading">Chưa chọn Phòng Lab & gói dịch vụ</Text>
            <Text variant="secondary" tone="secondary">
              Vui lòng chọn một Phòng Lab đối tác và gói tráng scan từ danh bạ trước khi tạo đơn.
            </Text>
            <Button
              testID="services.booking.choose-lab"
              label="Chọn Phòng Lab"
              variant="primary"
              onPress={onChooseLab}
            />
          </VStack>
        </Card>
      </VStack>
    );
  }

  const handleQuote = async () => {
    const input = buildBookingInputFromDraft(selectedLab, selectedPackage, draft);
    const validationError = validateLiveBookingInput(input);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    try {
      await quoteMutation.mutateAsync(buildLiveOrderPayload(input));
    } catch (err) {
      setError(mapServiceApiError(err));
    }
  };

  const handleSubmit = async () => {
    const input = buildBookingInputFromDraft(selectedLab, selectedPackage, draft);
    const validationError = validateLiveBookingInput(input);
    if (validationError) {
      setError(validationError);
      return;
    }
    const parsed = SubmitServiceOrderRequestSchema.safeParse(
      buildSubmitOrderPayload(input, idempotencyKey),
    );
    if (!parsed.success) {
      setError('Thông tin đơn hàng hoặc khung giờ lấy phim chưa đúng định dạng ISO.');
      return;
    }
    setError(null);
    try {
      await submitMutation.mutateAsync(parsed.data);
      await queryClient.invalidateQueries({ queryKey: filmLinkQueryKeys.orders.all });
      await clearDraft();
      onOrderCreated();
    } catch (err) {
      setError(mapServiceApiError(err));
      void markSubmissionFailed(err);
    }
  };

  const handleUpdateRoll = (
    index: number,
    updater: (roll: LiveBookingRollDraft) => LiveBookingRollDraft,
  ) => {
    setError(null);
    updateDraft((prev) => ({ ...prev, rolls: [...updateBookingRoll(prev.rolls, index, updater)] }));
  };

  return (
    <VStack gap="md">
      <DraftRecoveryBanner
        testID="services.booking.draft-recovery"
        visible={hasRecoverableDraft}
        pendingRetry={pendingRetry}
        lastErrorDetail={lastErrorDetail}
        lastSavedAt={lastSavedAt}
        onRestore={restoreDraft}
        onDiscard={() => void clearDraft()}
      />

      {error ? <Alert testID="services.booking.error" tone="danger" message={error} /> : null}

      <Card tone="brand">
        <VStack gap="xs">
          <Badge
            label={`${selectedPackage.filmProcess.displayName} · ${selectedPackage.filmFormat.displayName}`}
            tone="brand"
          />
          <Text variant="heading">{selectedLab.labName}</Text>
          <Text variant="secondary" tone="secondary">
            {selectedPackage.packageName} · {formatVnd(selectedPackage.priceVnd)}/cuộn ·{' '}
            {selectedPackage.turnaroundDays} ngày
          </Text>
        </VStack>
      </Card>

      <BookingRollEditorCard
        rolls={draft.rolls}
        activeIndex={activeRollIndex}
        selectedLab={selectedLab}
        fallbackPackage={selectedPackage}
        stocks={stocksQuery.data ?? []}
        onChangeStockSearch={setStockSearch}
        onAddRoll={() => {
          setError(null);
          const nextIndex = draft.rolls.length;
          updateDraft((prev) => ({
            ...prev,
            rolls: [...addBookingRoll(prev.rolls, selectedPackage.id)],
          }));
          setActiveRollIndex(nextIndex);
        }}
        onSelectRoll={setActiveRollIndex}
        onDuplicateRoll={(idx) => {
          setError(null);
          updateDraft((prev) => ({ ...prev, rolls: [...duplicateBookingRoll(prev.rolls, idx)] }));
          setActiveRollIndex(Math.min(idx + 1, 19));
        }}
        onRemoveRoll={(idx) => {
          setError(null);
          updateDraft((prev) => ({ ...prev, rolls: [...removeBookingRoll(prev.rolls, idx)] }));
          setActiveRollIndex((prevIdx) => Math.max(0, Math.min(prevIdx, draft.rolls.length - 2)));
        }}
        onUpdateRoll={handleUpdateRoll}
      />

      <Card>
        <VStack gap="md">
          <FilterChipGroup
            testIDPrefix="services.booking.payment"
            label="Phương thức thanh toán"
            options={LIVE_PAYMENT_OPTIONS}
            value={draft.paymentMethod}
            onChange={(paymentMethod) => {
              setError(null);
              updateDraft((prev) => ({ ...prev, paymentMethod }));
            }}
          />

          <FilterChipGroup
            testIDPrefix="services.booking.handover"
            label="Phương thức bàn giao phim"
            options={LIVE_HANDOVER_OPTIONS}
            value={draft.handoverMethod}
            onChange={(handoverMethod) => {
              setError(null);
              const range =
                handoverMethod === HandoverMethod.PICKUP && !draft.pickupWindowStartAt
                  ? buildPickupWindowRange('MORNING')
                  : null;
              updateDraft((prev) => ({
                ...prev,
                handoverMethod,
                ...(range
                  ? { pickupWindowStartAt: range.startAt, pickupWindowEndAt: range.endAt }
                  : {}),
              }));
            }}
          />

          <Text variant="caption" tone="muted">
            Giai đoạn 1 áp dụng gói Tiêu chuẩn (STANDARD) với Thanh toán tại Lab hoặc VNPay. Các lựa
            chọn PARCEL_SHIPPING, EXPRESS và COD chưa khả dụng.
          </Text>

          {draft.handoverMethod === HandoverMethod.PICKUP ? (
            <PickupFieldsSection draft={draft} onUpdateDraft={updateDraft} />
          ) : null}

          <Input
            testID="services.booking.note"
            label="Ghi chú kỹ thuật viên"
            value={draft.specialRequest}
            onChangeText={(specialRequest) => updateDraft((prev) => ({ ...prev, specialRequest }))}
            placeholder="Ví dụ: giữ nguyên vỏ cuộn, ưu tiên tone da tự nhiên..."
            icon={<Icon name="document-text-outline" size="sm" tone="muted" />}
          />

          {quoteMutation.data ? <QuoteSummaryCard quote={quoteMutation.data} /> : null}

          <Button
            testID="services.booking.quote"
            label={quoteMutation.isPending ? 'Đang tính báo giá...' : 'Tính báo giá trực tuyến'}
            variant="outline"
            size="md"
            loading={quoteMutation.isPending}
            onPress={() => void handleQuote()}
          />

          <Button
            testID="services.booking.submit"
            label={submitMutation.isPending ? 'Đang gửi đơn...' : 'Xác nhận đặt tráng & scan'}
            variant="primary"
            size="lg"
            loading={submitMutation.isPending}
            onPress={() => void handleSubmit()}
          />
        </VStack>
      </Card>
    </VStack>
  );
}
