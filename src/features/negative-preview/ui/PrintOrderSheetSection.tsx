import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  CATALOG_STALE_TIME_MS,
  type CreatePreviewPrintOrderRequest,
  filmLinkApi,
  filmLinkQueryKeys,
  type LabPrintPriceTierResponse,
  ORDER_STALE_TIME_MS,
  type PreviewPrintOrderQuoteResponse,
  type PrintSizeResponse,
  type PublicFilmLabSummaryResponse,
  type QuotePreviewPrintOrderRequest,
} from '@/shared/api';
import {
  authStore,
  CatalogStatus,
  HANDOVER_METHOD_LABELS,
  HandoverMethod,
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
  type PrintOrderDraft,
  PrintOrderDraftSchema,
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
  Input,
  SegmentedControl,
  Text,
  VStack,
} from '@/shared/ui';
import {
  buildCreatePrintOrderPayload,
  buildQuotePrintOrderPayload,
  clampPrintQuantity,
  filterSupportedPrintSizes,
  INITIAL_PRINT_ORDER_DRAFT,
  isPrintOrderDraftEmpty,
  mapNegativePreviewApiError,
  PRINT_ADDRESS_MAX_LENGTH,
  PRINT_DISTRICT_MAX_LENGTH,
  PRINT_NOTE_MAX_LENGTH,
  PRINT_PROVINCE_MAX_LENGTH,
  PRINT_QUANTITY_MAX,
  PRINT_QUANTITY_MIN,
  resolvePrintUnitPriceVnd,
  validatePrintOrderForm,
} from '../model/negative-preview';

export type PrintOrderSheetSectionProps = {
  readonly sessionId: number;
  readonly onClose: () => void;
};

function PrintLabSelectorCard({
  labs,
  isLoading,
  error,
  selectedLabId,
  onSelectLab,
}: {
  readonly labs: readonly PublicFilmLabSummaryResponse[];
  readonly isLoading: boolean;
  readonly error: unknown;
  readonly selectedLabId: number | null;
  readonly onSelectLab: (labId: number) => void;
}) {
  return (
    <Card testID="neg-preview.print-lab">
      <VStack gap="xs">
        <Text variant="heading">1. Chọn Phòng Lab thực hiện</Text>
        {isLoading ? (
          <Text variant="caption" tone="muted">
            Đang tải danh sách Phòng Lab...
          </Text>
        ) : null}
        {error ? (
          <Text variant="caption" tone="danger">
            {mapNegativePreviewApiError(error)}
          </Text>
        ) : null}
        {labs.length > 0 ? (
          <FilterChipGroup<string>
            testIDPrefix="neg-preview.print-lab-opt"
            options={labs.map((lab) => ({
              value: String(lab.id),
              label: lab.labName,
            }))}
            value={selectedLabId !== null ? String(selectedLabId) : ''}
            onChange={(val) => onSelectLab(Number(val))}
          />
        ) : null}
      </VStack>
    </Card>
  );
}

function PrintSizeSelectorCard({
  supportedSizes,
  priceTiers,
  isLoading,
  error,
  selectedLabId,
  selectedSizeId,
  quantity,
  onSelectSize,
}: {
  readonly supportedSizes: readonly PrintSizeResponse[];
  readonly priceTiers: readonly LabPrintPriceTierResponse[];
  readonly isLoading: boolean;
  readonly error: unknown;
  readonly selectedLabId: number | null;
  readonly selectedSizeId: number | null;
  readonly quantity: number;
  readonly onSelectSize: (sizeId: number) => void;
}) {
  const selectedUnitPrice =
    selectedLabId !== null && selectedSizeId !== null
      ? resolvePrintUnitPriceVnd(priceTiers, selectedSizeId, quantity)
      : null;

  return (
    <Card testID="neg-preview.print-size">
      <VStack gap="xs">
        <Text variant="heading">2. Chọn khổ ảnh in</Text>
        {isLoading ? (
          <Text variant="caption" tone="muted">
            Đang tải bảng giá và khổ ảnh hỗ trợ...
          </Text>
        ) : null}
        {error ? (
          <Text variant="caption" tone="danger">
            {mapNegativePreviewApiError(error)}
          </Text>
        ) : null}
        {!isLoading && supportedSizes.length === 0 ? (
          <Text variant="caption" tone="muted">
            Phòng Lab này chưa cấu hình khổ ảnh in hỗ trợ.
          </Text>
        ) : null}
        {supportedSizes.length > 0 ? (
          <FilterChipGroup<string>
            testIDPrefix="neg-preview.print-size-opt"
            options={supportedSizes.map((size) => {
              const tierPrice =
                selectedLabId !== null
                  ? resolvePrintUnitPriceVnd(priceTiers, size.id, quantity)
                  : null;
              return {
                value: String(size.id),
                label:
                  tierPrice !== null
                    ? `${size.code} (${size.displayName}) · ${formatVnd(tierPrice)}`
                    : `${size.code} (${size.displayName})`,
              };
            })}
            value={selectedSizeId !== null ? String(selectedSizeId) : ''}
            onChange={(val) => onSelectSize(Number(val))}
          />
        ) : null}
        {selectedUnitPrice !== null ? (
          <Text variant="caption" tone="brand">
            Đơn giá bậc số lượng {quantity}: {formatVnd(selectedUnitPrice)}/tấm
          </Text>
        ) : null}
      </VStack>
    </Card>
  );
}

function PrintQuantityAndOptionsCard({
  draft,
  onUpdate,
}: {
  readonly draft: PrintOrderDraft;
  readonly onUpdate: (patch: Partial<PrintOrderDraft>) => void;
}) {
  return (
    <Card>
      <VStack gap="sm">
        <HStack justify="between" align="center">
          <Text variant="heading">
            3. Số lượng ảnh ({PRINT_QUANTITY_MIN}–{PRINT_QUANTITY_MAX})
          </Text>
          <HStack gap="xs" align="center">
            <Button
              testID="neg-preview.print-qty-dec"
              label="-"
              size="sm"
              variant="outline"
              disabled={draft.quantity <= PRINT_QUANTITY_MIN}
              onPress={() => onUpdate({ quantity: clampPrintQuantity(draft.quantity - 1) })}
            />
            <Badge label={`${draft.quantity} tấm`} tone="brand" />
            <Button
              testID="neg-preview.print-qty-inc"
              label="+"
              size="sm"
              variant="outline"
              disabled={draft.quantity >= PRINT_QUANTITY_MAX}
              onPress={() => onUpdate({ quantity: clampPrintQuantity(draft.quantity + 1) })}
            />
          </HStack>
        </HStack>

        <FilterChipGroup<HandoverMethod>
          testIDPrefix="neg-preview.print-handover"
          label="4. Hình thức nhận ảnh in"
          options={[
            {
              value: HandoverMethod.SELF_DROP_OFF,
              label: HANDOVER_METHOD_LABELS[HandoverMethod.SELF_DROP_OFF],
            },
            {
              value: HandoverMethod.PICKUP,
              label: HANDOVER_METHOD_LABELS[HandoverMethod.PICKUP],
            },
            {
              value: HandoverMethod.PARCEL_SHIPPING,
              label: HANDOVER_METHOD_LABELS[HandoverMethod.PARCEL_SHIPPING],
            },
          ]}
          value={draft.filmHandoverMethod}
          onChange={(filmHandoverMethod) => onUpdate({ filmHandoverMethod })}
        />

        <SegmentedControl<PrintOrderDraft['paymentMethod']>
          testIDPrefix="neg-preview.print-payment"
          options={[
            {
              value: PaymentMethod.PAY_AT_LAB,
              label: PAYMENT_METHOD_LABELS[PaymentMethod.PAY_AT_LAB],
            },
            {
              value: PaymentMethod.ONLINE,
              label: PAYMENT_METHOD_LABELS[PaymentMethod.ONLINE],
            },
          ]}
          value={draft.paymentMethod}
          onChange={(paymentMethod) => onUpdate({ paymentMethod })}
        />
      </VStack>
    </Card>
  );
}

function PrintQuoteSummaryCard({ quote }: { readonly quote: PreviewPrintOrderQuoteResponse }) {
  return (
    <Card testID="neg-preview.print-quote-summary" tone="muted">
      <VStack gap="xs">
        <Text variant="heading">Báo giá đơn in ảnh</Text>
        <HStack justify="between">
          <Text variant="caption" tone="secondary">
            Khổ {quote.printSizeCode} ({quote.printSizeName}) × {quote.quantity}
          </Text>
          <Text variant="caption">{formatVnd(quote.unitPriceVnd)}/tấm</Text>
        </HStack>
        <HStack justify="between">
          <Text variant="caption" tone="secondary">
            Tiền in ảnh
          </Text>
          <Text variant="caption">{formatVnd(quote.printSubtotalVnd)}</Text>
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
        {quote.expectedReturnAt ? (
          <Text variant="caption" tone="muted">
            Dự kiến hoàn thành: {formatDateTimeVn(quote.expectedReturnAt)}
          </Text>
        ) : null}
      </VStack>
    </Card>
  );
}

function HandoverAddressFields({
  draft,
  onUpdate,
}: {
  readonly draft: PrintOrderDraft;
  readonly onUpdate: (patch: Partial<PrintOrderDraft>) => void;
}) {
  if (draft.filmHandoverMethod === HandoverMethod.SELF_DROP_OFF) {
    return null;
  }

  return (
    <Card tone="muted">
      <VStack gap="sm">
        <Text variant="heading">Thông tin giao nhận ảnh in</Text>
        <Input
          testID="neg-preview.print-address"
          label="Địa chỉ nhận ảnh"
          required
          value={draft.customerAddressLine}
          onChangeText={(customerAddressLine) =>
            onUpdate({
              customerAddressLine: customerAddressLine.slice(0, PRINT_ADDRESS_MAX_LENGTH),
            })
          }
          placeholder="Số nhà, tên đường..."
        />
        <Input
          testID="neg-preview.print-district"
          label="Quận / Huyện"
          required
          value={draft.customerDistrict}
          onChangeText={(customerDistrict) =>
            onUpdate({ customerDistrict: customerDistrict.slice(0, PRINT_DISTRICT_MAX_LENGTH) })
          }
          placeholder="Ví dụ: Quận 1"
        />
        <Input
          testID="neg-preview.print-province"
          label="Tỉnh / Thành phố"
          required
          value={draft.customerProvince}
          onChangeText={(customerProvince) =>
            onUpdate({ customerProvince: customerProvince.slice(0, PRINT_PROVINCE_MAX_LENGTH) })
          }
          placeholder="Ví dụ: TP. Hồ Chí Minh"
        />
        <Input
          testID="neg-preview.print-phone"
          label="Số điện thoại liên hệ"
          required
          keyboardType="phone-pad"
          value={draft.customerPhone}
          onChangeText={(customerPhone) => onUpdate({ customerPhone })}
          placeholder="0901234567"
        />
      </VStack>
    </Card>
  );
}

export function PrintOrderSheetSection({ sessionId, onClose }: PrintOrderSheetSectionProps) {
  const queryClient = useQueryClient();
  const accountId = useStore(authStore, (state) => state.user?.id ?? null);
  const [printError, setPrintError] = useState<string | null>(null);

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
  } = useDraftPersistence<PrintOrderDraft>({
    flowKey: 'print_order',
    accountId,
    schema: PrintOrderDraftSchema,
    initialDraft: INITIAL_PRINT_ORDER_DRAFT,
    isEmpty: isPrintOrderDraftEmpty,
  });

  const labsQuery = useQuery({
    queryKey: filmLinkQueryKeys.labs.list({ size: 20 }),
    queryFn: () => filmLinkApi.searchPublicFilmLabs({ size: 20 }),
    staleTime: CATALOG_STALE_TIME_MS,
  });

  const printSizesQuery = useQuery({
    queryKey: filmLinkQueryKeys.catalogs.printSizes(),
    queryFn: () => filmLinkApi.fetchPrintSizes(),
    staleTime: CATALOG_STALE_TIME_MS,
  });

  const labPricesQuery = useQuery({
    queryKey: filmLinkQueryKeys.labs.printPrices(draft.filmLabId ?? 0),
    queryFn: () => filmLinkApi.fetchLabPrintPrices(draft.filmLabId ?? 0),
    enabled: draft.filmLabId !== null,
    staleTime: ORDER_STALE_TIME_MS,
  });

  const quoteMutation = useMutation({
    mutationFn: (payload: QuotePreviewPrintOrderRequest) =>
      filmLinkApi.quoteNegativePreviewPrintOrder(sessionId, payload),
  });

  const submitMutation = useMutation({
    mutationFn: (payload: CreatePreviewPrintOrderRequest) =>
      filmLinkApi.createNegativePreviewPrintOrder(sessionId, payload),
  });

  const labs = labsQuery.data?.content ?? [];
  const priceTiers = labPricesQuery.data ?? [];
  const supportedSizes =
    draft.filmLabId !== null
      ? filterSupportedPrintSizes(printSizesQuery.data ?? [], priceTiers)
      : (printSizesQuery.data ?? []).filter((size) => size.status === CatalogStatus.ACTIVE);

  const patchDraft = (patch: Partial<PrintOrderDraft>) => {
    setPrintError(null);
    quoteMutation.reset();
    updateDraft((prev) => ({ ...prev, ...patch, sessionId }));
  };

  const handleQuote = async () => {
    const validation = validatePrintOrderForm(draft);
    if (validation) {
      setPrintError(validation);
      return;
    }
    setPrintError(null);
    try {
      await quoteMutation.mutateAsync(buildQuotePrintOrderPayload(draft));
    } catch (err) {
      setPrintError(mapNegativePreviewApiError(err));
    }
  };

  const handleSubmit = async () => {
    const validation = validatePrintOrderForm(draft);
    if (validation) {
      setPrintError(validation);
      return;
    }
    setPrintError(null);
    try {
      await submitMutation.mutateAsync(buildCreatePrintOrderPayload(draft, idempotencyKey));
      await queryClient.invalidateQueries({ queryKey: filmLinkQueryKeys.orders.all });
      await clearDraft();
      router.push('/(tabs)/orders');
    } catch (err) {
      setPrintError(mapNegativePreviewApiError(err));
      await markSubmissionFailed(err);
    }
  };

  return (
    <VStack gap="md">
      <Card tone="brand">
        <HStack justify="between" align="center">
          <VStack gap="none" className="flex-1">
            <Badge label="Bước 4B · Đặt in ảnh tại Lab" tone="brand" />
            <Text variant="heading">Thông số in ảnh dương bản</Text>
          </VStack>
          <Button
            testID="neg-preview.print-close"
            label="Đóng"
            size="sm"
            variant="ghost"
            onPress={onClose}
          />
        </HStack>
      </Card>

      <DraftRecoveryBanner
        testID="neg-preview.print.draft-recovery"
        visible={hasRecoverableDraft}
        pendingRetry={pendingRetry}
        lastErrorDetail={lastErrorDetail}
        lastSavedAt={lastSavedAt}
        onRestore={() => {
          setPrintError(null);
          void restoreDraft();
        }}
        onDiscard={() => {
          setPrintError(null);
          void clearDraft();
        }}
      />

      {printError ? (
        <Alert testID="neg-preview.print.error" tone="danger" message={printError} />
      ) : null}

      <PrintLabSelectorCard
        labs={labs}
        isLoading={labsQuery.isLoading}
        error={labsQuery.isError ? labsQuery.error : null}
        selectedLabId={draft.filmLabId}
        onSelectLab={(filmLabId) => patchDraft({ filmLabId, printSizeId: null })}
      />

      <PrintSizeSelectorCard
        supportedSizes={supportedSizes}
        priceTiers={priceTiers}
        isLoading={printSizesQuery.isLoading || labPricesQuery.isLoading}
        error={labPricesQuery.isError ? labPricesQuery.error : null}
        selectedLabId={draft.filmLabId}
        selectedSizeId={draft.printSizeId}
        quantity={draft.quantity}
        onSelectSize={(printSizeId) => patchDraft({ printSizeId })}
      />

      <PrintQuantityAndOptionsCard draft={draft} onUpdate={patchDraft} />

      <HandoverAddressFields draft={draft} onUpdate={patchDraft} />

      <Input
        testID="neg-preview.print-note"
        label="Ghi chú cho Phòng Lab (tùy chọn)"
        value={draft.note}
        onChangeText={(note) => patchDraft({ note: note.slice(0, PRINT_NOTE_MAX_LENGTH) })}
        placeholder="Ví dụ: In giấy lụa mờ, không bo viền trắng"
      />

      {quoteMutation.data ? <PrintQuoteSummaryCard quote={quoteMutation.data} /> : null}

      <VStack gap="xs">
        <Button
          testID="neg-preview.print-quote"
          label={quoteMutation.isPending ? 'Đang tính báo giá...' : 'Xem báo giá in'}
          variant="outline"
          loading={quoteMutation.isPending}
          disabled={quoteMutation.isPending || submitMutation.isPending}
          onPress={() => void handleQuote()}
        />
        <Button
          testID="neg-preview.print-submit"
          label={submitMutation.isPending ? 'Đang gửi đơn in...' : 'Đặt in tại Lab'}
          variant="primary"
          loading={submitMutation.isPending}
          disabled={submitMutation.isPending || quoteMutation.isPending}
          onPress={() => void handleSubmit()}
        />
      </VStack>
    </VStack>
  );
}
