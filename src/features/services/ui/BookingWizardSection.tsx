import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  CATALOG_STALE_TIME_MS,
  type FilmStockResponse,
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
  buildLiveOrderPayload,
  buildPickupWindowRange,
  buildSubmitOrderPayload,
  clampExposureCount,
  clampPushPullStops,
  clampRollCount,
  clampShootingIso,
  type LiveBookingDraft,
  LiveBookingDraftSchema,
  type LiveBookingInput,
  mapServiceApiError,
} from '../model/services';

export type BookingWizardSectionProps = {
  readonly selectedLab: PublicFilmLabResponse | null;
  readonly selectedPackage: PublicServicePackage | null;
  readonly onChooseLab: () => void;
  readonly onOrderCreated: () => void;
};

const INITIAL_LIVE_BOOKING_DRAFT: LiveBookingDraft = {
  filmStockId: null,
  filmStockNameText: '',
  scanOptionId: null,
  rollCount: 1,
  exposureCount: 36,
  shootingIso: 400,
  pushPullStops: 0,
  handoverMethod: HandoverMethod.SELF_DROP_OFF,
  specialRequest: '',
  customerAddressLine: '',
  customerDistrict: '',
  customerProvince: '',
  customerPhone: '',
  pickupWindowStartAt: '',
  pickupWindowEndAt: '',
};

const ISO_PRESETS = ['100', '200', '400', '800', '1600', '3200'] as const;

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

function resolveScanOptionId(
  selectedPackage: PublicServicePackage,
  draftScanOptionId: number | null,
): number | null {
  if (draftScanOptionId === null) {
    return null;
  }
  return selectedPackage.scanOptions.some((opt) => opt.id === draftScanOptionId)
    ? draftScanOptionId
    : null;
}

function buildBookingInputFromDraft(
  selectedLab: PublicFilmLabResponse,
  selectedPackage: PublicServicePackage,
  draft: LiveBookingDraft,
): LiveBookingInput {
  return {
    filmLabId: selectedLab.id,
    servicePackageId: selectedPackage.id,
    filmFormatId: selectedPackage.filmFormat.id,
    servicePackageScanOptionId: resolveScanOptionId(selectedPackage, draft.scanOptionId),
    filmStockId: draft.filmStockId,
    filmStockNameText: draft.filmStockNameText,
    rollCount: draft.rollCount,
    exposureCount: draft.exposureCount,
    shootingIso: draft.shootingIso,
    pushPullStops: selectedPackage.pushPullAvailable ? draft.pushPullStops : 0,
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
  const roll = {
    filmStockId: input.filmStockId,
    filmStockNameText: input.filmStockId ? null : input.filmStockNameText,
    filmFormatId: input.filmFormatId,
    exposureCount: input.exposureCount,
    shootingIso: input.shootingIso,
    servicePackageId: input.servicePackageId,
    pushPullStops: input.pushPullStops,
  };
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
    rolls: Array.from({ length: payload.rolls.length }, () => roll),
  });
}

function FilmStockSelectorSection({
  stocks,
  selectedStockId,
  customStockName,
  onChangeCustomStock,
  onSelectCatalogStock,
}: {
  readonly stocks: readonly FilmStockResponse[];
  readonly selectedStockId: number | null;
  readonly customStockName: string;
  readonly onChangeCustomStock: (text: string) => void;
  readonly onSelectCatalogStock: (stockId: number) => void;
}) {
  return (
    <VStack gap="sm">
      <Input
        testID="services.booking.film-stock"
        label="Dòng phim (chọn danh mục hoặc nhập tự do)"
        value={customStockName}
        onChangeText={onChangeCustomStock}
        placeholder="Kodak Portra 400"
        icon={<Icon name="camera-outline" size="sm" tone="muted" />}
      />
      {selectedStockId !== null ? (
        <Badge label={`Đã chọn dòng phim danh mục #${selectedStockId}`} tone="brand" />
      ) : null}
      {stocks.length > 0 ? (
        <FilterChipGroup
          testIDPrefix="services.booking.stock"
          label="Danh mục phim phổ biến"
          options={stocks.map((stock) => ({
            value: String(stock.id),
            label: `${stock.stockName} (${stock.iso})`,
          }))}
          value={selectedStockId !== null ? String(selectedStockId) : ''}
          onChange={(val) => onSelectCatalogStock(Number(val))}
          scrollable
        />
      ) : null}
    </VStack>
  );
}

function RollSpecsSection({
  draft,
  selectedPackage,
  onUpdateDraft,
}: {
  readonly draft: LiveBookingDraft;
  readonly selectedPackage: PublicServicePackage;
  readonly onUpdateDraft: (updater: (prev: LiveBookingDraft) => LiveBookingDraft) => void;
}) {
  const effectiveStops = selectedPackage.pushPullAvailable ? draft.pushPullStops : 0;

  return (
    <VStack gap="sm">
      <HStack justify="between" align="center" className="py-1">
        <VStack gap="none">
          <Text variant="secondary">Số lượng cuộn</Text>
          <Text variant="caption" tone="muted">
            Từ 1 đến 20 cuộn/đơn
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
              onUpdateDraft((prev) => ({ ...prev, rollCount: clampRollCount(prev.rollCount, -1) }))
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
              onUpdateDraft((prev) => ({ ...prev, rollCount: clampRollCount(prev.rollCount, 1) }))
            }
          />
        </HStack>
      </HStack>

      <HStack justify="between" align="center" className="py-1">
        <VStack gap="none">
          <Text variant="secondary">Số kiểu chụp / cuộn</Text>
          <Text variant="caption" tone="muted">
            Từ 1 đến 40 kiểu
          </Text>
        </VStack>
        <HStack gap="sm" align="center">
          <Button
            testID="services.booking.exposures-dec"
            label="-"
            size="sm"
            variant="outline"
            className="w-11"
            onPress={() =>
              onUpdateDraft((prev) => ({
                ...prev,
                exposureCount: clampExposureCount(prev.exposureCount, -1),
              }))
            }
          />
          <Text variant="heading" className="w-8 text-center">
            {draft.exposureCount}
          </Text>
          <Button
            testID="services.booking.exposures-inc"
            label="+"
            size="sm"
            variant="outline"
            className="w-11"
            onPress={() =>
              onUpdateDraft((prev) => ({
                ...prev,
                exposureCount: clampExposureCount(prev.exposureCount, 1),
              }))
            }
          />
        </HStack>
      </HStack>

      <FilterChipGroup
        testIDPrefix="services.booking.iso"
        label="Độ nhạy sáng khi chụp (Shooting ISO)"
        options={ISO_PRESETS.map((iso) => ({ value: iso, label: `ISO ${iso}` }))}
        value={String(draft.shootingIso)}
        onChange={(iso) =>
          onUpdateDraft((prev) => ({ ...prev, shootingIso: clampShootingIso(Number(iso)) }))
        }
        scrollable
      />

      <HStack justify="between" align="center" className="py-1">
        <VStack gap="none" className="flex-1 pr-2">
          <Text variant="secondary">Push / Pull (Stops)</Text>
          <Text variant="caption" tone="muted">
            {selectedPackage.pushPullAvailable
              ? `+${formatVnd(selectedPackage.pushPullSurchargePerStopVnd ?? 0)} / stop / cuộn`
              : 'Gói này không hỗ trợ Push / Pull'}
          </Text>
        </VStack>
        <HStack gap="sm" align="center">
          <Button
            testID="services.booking.stops-dec"
            label="-"
            size="sm"
            variant="outline"
            className="w-11"
            disabled={!selectedPackage.pushPullAvailable}
            onPress={() =>
              onUpdateDraft((prev) => ({
                ...prev,
                pushPullStops: clampPushPullStops(prev.pushPullStops, -1),
              }))
            }
          />
          <Text variant="heading" className="w-8 text-center">
            {effectiveStops > 0 ? `+${effectiveStops}` : effectiveStops}
          </Text>
          <Button
            testID="services.booking.stops-inc"
            label="+"
            size="sm"
            variant="outline"
            className="w-11"
            disabled={!selectedPackage.pushPullAvailable}
            onPress={() =>
              onUpdateDraft((prev) => ({
                ...prev,
                pushPullStops: clampPushPullStops(prev.pushPullStops, 1),
              }))
            }
          />
        </HStack>
      </HStack>
    </VStack>
  );
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
    isEmpty: (d) =>
      d.filmStockId === null && !d.filmStockNameText.trim() && !d.specialRequest.trim(),
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

  const effectiveScanOptionId = resolveScanOptionId(selectedPackage, draft.scanOptionId);

  const handleQuote = async () => {
    const input = buildBookingInputFromDraft(selectedLab, selectedPackage, draft);
    const validationError = validateLiveBookingInput(input);
    if (validationError) {
      setError(validationError);
      return;
    }
    const payload = buildLiveOrderPayload(input);
    setError(null);
    try {
      await quoteMutation.mutateAsync(payload);
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
    const payload = buildSubmitOrderPayload(input, idempotencyKey);
    const parsed = SubmitServiceOrderRequestSchema.safeParse(payload);
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

      <Card>
        <VStack gap="md">
          <FilmStockSelectorSection
            stocks={stocksQuery.data ?? []}
            selectedStockId={draft.filmStockId}
            customStockName={draft.filmStockNameText}
            onChangeCustomStock={(text) => {
              setError(null);
              setStockSearch(text);
              updateDraft((prev) => ({ ...prev, filmStockId: null, filmStockNameText: text }));
            }}
            onSelectCatalogStock={(stockId) => {
              setError(null);
              updateDraft((prev) => ({ ...prev, filmStockId: stockId, filmStockNameText: '' }));
            }}
          />

          {selectedPackage.scanOptions.length > 0 ? (
            <FilterChipGroup
              testIDPrefix="services.booking.scan"
              label="Tùy chọn độ phân giải Scan"
              options={[
                { value: 'NONE', label: 'Mặc định gói' },
                ...selectedPackage.scanOptions.map((opt) => ({
                  value: String(opt.id),
                  label: `${opt.resolutionLabel} (${opt.priceVnd === 0 ? 'Miễn phí' : formatVnd(opt.priceVnd)})`,
                })),
              ]}
              value={effectiveScanOptionId !== null ? String(effectiveScanOptionId) : 'NONE'}
              onChange={(val) =>
                updateDraft((prev) => ({
                  ...prev,
                  scanOptionId: val === 'NONE' ? null : Number(val),
                }))
              }
              scrollable
            />
          ) : null}

          <RollSpecsSection
            draft={draft}
            selectedPackage={selectedPackage}
            onUpdateDraft={(updater) => {
              setError(null);
              updateDraft(updater);
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
            Giai đoạn 1 áp dụng gói Tiêu chuẩn (STANDARD) và thanh toán VNPay trực tuyến. Các lựa
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
