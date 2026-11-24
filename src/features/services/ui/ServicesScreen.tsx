import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  CATALOG_STALE_TIME_MS,
  type CatalogItemResponse,
  filmLinkApi,
  filmLinkQueryKeys,
  type PublicFilmLabResponse,
  type PublicFilmLabSummaryResponse,
  type PublicServicePackage,
  SIGNED_URL_STALE_TIME_MS,
} from '@/shared/api';
import { authStore, type LabSelectionDraft, LabSelectionDraftSchema } from '@/shared/domain';
import { useDraftPersistence } from '@/shared/hooks';
import { firstRouteParam, formatVnd, type RawRouteParam, useStore } from '@/shared/lib';
import {
  Alert,
  Badge,
  Button,
  Card,
  DraftRecoveryBanner,
  EmptyState,
  FilterChipGroup,
  HStack,
  Icon,
  Input,
  MediaImage,
  Screen,
  SegmentedControl,
  Text,
  VStack,
} from '@/shared/ui';
import {
  buildPublicLabSearchParams,
  filterPublicLabSummaries,
  formatOpeningHoursSummary,
  mapServiceApiError,
} from '../model/services';
import { BookingWizardSection } from './BookingWizardSection';

function parsePositiveId(raw: string | undefined): number | null {
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function buildCatalogFilterOptions(
  allLabel: string,
  items: readonly CatalogItemResponse[],
): readonly { readonly value: string; readonly label: string }[] {
  return [
    { value: 'ALL', label: allLabel },
    ...items.map((item) => ({ value: String(item.id), label: item.displayName })),
  ];
}

function resolveSelectedPackage(
  labDetail: PublicFilmLabResponse | null,
  selectedPackage: PublicServicePackage | null,
): PublicServicePackage | null {
  if (!labDetail) {
    return null;
  }
  if (selectedPackage && labDetail.packages.some((pkg) => pkg.id === selectedPackage.id)) {
    return selectedPackage;
  }
  return labDetail.packages[0] ?? null;
}

function LabPackageRow({
  pkg,
  isSelected,
  onSelect,
}: {
  readonly pkg: PublicServicePackage;
  readonly isSelected: boolean;
  readonly onSelect: (pkg: PublicServicePackage) => void;
}) {
  return (
    <Card tone={isSelected ? 'brand' : 'muted'} className="p-3">
      <HStack justify="between" align="center" gap="sm">
        <VStack gap="none" className="flex-1">
          <Text variant="secondary">{pkg.packageName}</Text>
          <Text variant="caption" tone="muted">
            {pkg.filmProcess.displayName} · {pkg.filmFormat.displayName} · {pkg.turnaroundDays} ngày
          </Text>
        </VStack>
        <Button
          testID={`services.pkg.${pkg.id}`}
          label={formatVnd(pkg.priceVnd)}
          size="sm"
          variant={isSelected ? 'primary' : 'outline'}
          onPress={() => onSelect(pkg)}
        />
      </HStack>
    </Card>
  );
}

function LabDetailSection({
  labDetail,
  selectedPackageId,
  onSelectPackage,
}: {
  readonly labDetail: PublicFilmLabResponse;
  readonly selectedPackageId: number | null;
  readonly onSelectPackage: (lab: PublicFilmLabResponse, pkg: PublicServicePackage) => void;
}) {
  const coverImage = labDetail.images[0];

  return (
    <VStack gap="sm" className="pt-2">
      {coverImage ? (
        <MediaImage uri={coverImage.url} accessibilityLabel={`Ảnh ${labDetail.labName}`} />
      ) : null}
      {labDetail.description ? (
        <Text variant="body" tone="secondary">
          {labDetail.description}
        </Text>
      ) : null}
      <Text variant="caption" tone="muted">
        {formatOpeningHoursSummary(labDetail.openingHours)}
      </Text>
      {labDetail.packages.length === 0 ? (
        <Text variant="caption" tone="muted">
          Phòng Lab chưa công khai gói dịch vụ trực tuyến.
        </Text>
      ) : (
        <VStack gap="xs">
          {labDetail.packages.map((pkg) => (
            <LabPackageRow
              key={pkg.id}
              pkg={pkg}
              isSelected={pkg.id === selectedPackageId}
              onSelect={(chosenPkg) => onSelectPackage(labDetail, chosenPkg)}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
}

function LabSummaryCard({
  lab,
  isActive,
  labDetail,
  isLoadingDetail,
  selectedPackageId,
  onInspectLab,
  onSelectPackage,
}: {
  readonly lab: PublicFilmLabSummaryResponse;
  readonly isActive: boolean;
  readonly labDetail: PublicFilmLabResponse | null;
  readonly isLoadingDetail: boolean;
  readonly selectedPackageId: number | null;
  readonly onInspectLab: (labId: number) => void;
  readonly onSelectPackage: (lab: PublicFilmLabResponse, pkg: PublicServicePackage) => void;
}) {
  return (
    <Card>
      <VStack gap="sm">
        <HStack justify="between" align="start">
          <VStack gap="none" className="flex-1 pr-2">
            <HStack gap="xs" align="center">
              <Text variant="heading">{lab.labName}</Text>
              <Icon name="checkmark-circle" size="xs" tone="brand" />
            </HStack>
            <Text variant="caption" tone="muted">
              {lab.addressLine}, {lab.district}, {lab.province}
            </Text>
          </VStack>
          <Badge label={`Từ ${formatVnd(lab.minPriceVnd)}`} tone="brand" />
        </HStack>

        <Button
          testID={`services.lab.${lab.id}`}
          label={isActive ? 'Đang xem gói dịch vụ' : 'Xem gói dịch vụ'}
          size="sm"
          variant={isActive ? 'secondary' : 'outline'}
          onPress={() => onInspectLab(lab.id)}
        />

        {isActive && isLoadingDetail ? (
          <Text variant="caption" tone="muted">
            Đang tải chi tiết và bảng giá Phòng Lab...
          </Text>
        ) : null}

        {isActive && labDetail && labDetail.id === lab.id ? (
          <LabDetailSection
            labDetail={labDetail}
            selectedPackageId={selectedPackageId}
            onSelectPackage={onSelectPackage}
          />
        ) : null}
      </VStack>
    </Card>
  );
}

function ServicesDirectorySection({
  search,
  onChangeSearch,
  selectedProcessId,
  onChangeProcessId,
  selectedFormatId,
  onChangeFormatId,
  selectedServiceTypeId,
  onChangeServiceTypeId,
  sortMode,
  onChangeSortMode,
  processOptions,
  formatOptions,
  serviceTypeOptions,
  filteredLabs,
  activeLabId,
  labDetail,
  isLoadingLabs,
  isLoadingDetail,
  hasError,
  selectedPackageId,
  onResetFilters,
  onInspectLab,
  onSelectPackage,
}: {
  readonly search: string;
  readonly onChangeSearch: (value: string) => void;
  readonly selectedProcessId: number | 'ALL';
  readonly onChangeProcessId: (value: number | 'ALL') => void;
  readonly selectedFormatId: number | 'ALL';
  readonly onChangeFormatId: (value: number | 'ALL') => void;
  readonly selectedServiceTypeId: number | 'ALL';
  readonly onChangeServiceTypeId: (value: number | 'ALL') => void;
  readonly sortMode: 'default' | 'price';
  readonly onChangeSortMode: (value: 'default' | 'price') => void;
  readonly processOptions: readonly { readonly value: string; readonly label: string }[];
  readonly formatOptions: readonly { readonly value: string; readonly label: string }[];
  readonly serviceTypeOptions: readonly { readonly value: string; readonly label: string }[];
  readonly filteredLabs: readonly PublicFilmLabSummaryResponse[];
  readonly activeLabId: number | null;
  readonly labDetail: PublicFilmLabResponse | null;
  readonly isLoadingLabs: boolean;
  readonly isLoadingDetail: boolean;
  readonly hasError: boolean;
  readonly selectedPackageId: number | null;
  readonly onResetFilters: () => void;
  readonly onInspectLab: (labId: number) => void;
  readonly onSelectPackage: (lab: PublicFilmLabResponse, pkg: PublicServicePackage) => void;
}) {
  return (
    <VStack gap="md">
      <Input
        testID="services.search"
        value={search}
        onChangeText={onChangeSearch}
        placeholder="Tìm theo tên Phòng Lab, quận hoặc tỉnh thành..."
        icon={<Icon name="search-outline" size="sm" tone="muted" />}
      />

      <FilterChipGroup
        testIDPrefix="services.service-type"
        label="Loại dịch vụ (Service Type)"
        options={serviceTypeOptions}
        value={String(selectedServiceTypeId)}
        onChange={(value) => onChangeServiceTypeId(value === 'ALL' ? 'ALL' : Number(value))}
        scrollable
      />

      <FilterChipGroup
        testIDPrefix="services.process"
        label="Hóa chất tráng (Process)"
        options={processOptions}
        value={String(selectedProcessId)}
        onChange={(value) => onChangeProcessId(value === 'ALL' ? 'ALL' : Number(value))}
        scrollable
      />

      <FilterChipGroup
        testIDPrefix="services.format"
        label="Khổ phim (Film Format)"
        options={formatOptions}
        value={String(selectedFormatId)}
        onChange={(value) => onChangeFormatId(value === 'ALL' ? 'ALL' : Number(value))}
        scrollable
      />

      <FilterChipGroup
        testIDPrefix="services.sort"
        label="Sắp xếp kết quả"
        options={[
          { value: 'default', label: 'Mặc định' },
          { value: 'price', label: 'Giá thấp nhất' },
        ]}
        value={sortMode}
        onChange={(value) => onChangeSortMode(value === 'price' ? 'price' : 'default')}
      />

      {!isLoadingLabs && !hasError && filteredLabs.length === 0 ? (
        <EmptyState
          testID="services.empty"
          actionTestID="services.reset-filters"
          title="Không tìm thấy Phòng Lab phù hợp"
          description="Hãy thử đặt lại bộ lọc dịch vụ, quy trình hóa chất hoặc khổ phim."
          actionLabel="Xóa bộ lọc"
          icon={<Icon name="search" size="lg" tone="muted" />}
          onAction={onResetFilters}
        />
      ) : (
        filteredLabs.map((lab) => (
          <LabSummaryCard
            key={lab.id}
            lab={lab}
            isActive={activeLabId === lab.id}
            labDetail={labDetail}
            isLoadingDetail={isLoadingDetail}
            selectedPackageId={selectedPackageId}
            onInspectLab={onInspectLab}
            onSelectPackage={onSelectPackage}
          />
        ))
      )}
    </VStack>
  );
}

function ServicesStatusBanner({
  error,
  isLoading,
  onRetry,
}: {
  readonly error: unknown;
  readonly isLoading: boolean;
  readonly onRetry: () => void;
}) {
  return (
    <>
      {error ? (
        <VStack gap="sm">
          <Alert testID="services.error" tone="danger" message={mapServiceApiError(error)} />
          <Button
            testID="services.retry"
            label="Thử lại"
            variant="outline"
            size="sm"
            onPress={onRetry}
          />
        </VStack>
      ) : null}

      {isLoading ? (
        <Card testID="services.loading" tone="muted">
          <Text variant="secondary" tone="muted">
            Đang tải danh bạ Phòng Lab và gói dịch vụ...
          </Text>
        </Card>
      ) : null}
    </>
  );
}

const INITIAL_LAB_SELECTION_DRAFT: LabSelectionDraft = {
  activeTab: 'directory',
  search: '',
  processId: 'ALL',
  formatId: 'ALL',
  serviceTypeId: 'ALL',
  sort: 'default',
  selectedLabId: null,
};

function isLabSelectionDraftEmpty(draft: LabSelectionDraft): boolean {
  return (
    draft.activeTab === INITIAL_LAB_SELECTION_DRAFT.activeTab &&
    draft.search.trim().length === 0 &&
    draft.processId === INITIAL_LAB_SELECTION_DRAFT.processId &&
    draft.formatId === INITIAL_LAB_SELECTION_DRAFT.formatId &&
    draft.serviceTypeId === INITIAL_LAB_SELECTION_DRAFT.serviceTypeId &&
    draft.sort === INITIAL_LAB_SELECTION_DRAFT.sort &&
    draft.selectedLabId === INITIAL_LAB_SELECTION_DRAFT.selectedLabId
  );
}

function resolveActiveServiceError(
  activeLabId: number | null,
  errors: readonly unknown[],
  detailError: unknown,
): unknown {
  return errors.find(Boolean) ?? (activeLabId !== null ? detailError : null);
}

function refetchErroredServiceQueries(
  queries: readonly { readonly isError: boolean; readonly refetch: () => Promise<unknown> }[],
): void {
  for (const query of queries) {
    if (query.isError) {
      void query.refetch();
    }
  }
}

export function ServicesScreen() {
  const params = useLocalSearchParams<{ tab?: RawRouteParam; labId?: RawRouteParam }>();
  const paramLabId = parsePositiveId(firstRouteParam(params.labId));
  const paramTab = firstRouteParam(params.tab);
  const user = useStore(authStore, (state) => state.user);

  const [tabOverride, setTabOverride] = useState<'directory' | 'booking' | null>(null);
  const [selectedLabIdOverride, setSelectedLabIdOverride] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PublicServicePackage | null>(null);
  const [search, setSearch] = useState('');
  const [selectedProcessId, setSelectedProcessId] = useState<number | 'ALL'>('ALL');
  const [selectedFormatId, setSelectedFormatId] = useState<number | 'ALL'>('ALL');
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState<number | 'ALL'>('ALL');
  const [sortMode, setSortMode] = useState<'default' | 'price'>('default');

  const {
    hasRecoverableDraft,
    pendingRetry,
    lastErrorDetail,
    lastSavedAt,
    updateDraft,
    restoreDraft,
    clearDraft,
  } = useDraftPersistence<LabSelectionDraft>({
    flowKey: 'services_lab_selection',
    accountId: user?.id ?? null,
    schema: LabSelectionDraftSchema,
    initialDraft: INITIAL_LAB_SELECTION_DRAFT,
    isEmpty: isLabSelectionDraftEmpty,
  });

  const activeTab = tabOverride ?? (paramTab === 'booking' ? 'booking' : 'directory');
  const activeLabId = selectedLabIdOverride ?? paramLabId;

  const processesQuery = useQuery({
    queryKey: filmLinkQueryKeys.catalogs.processes(),
    queryFn: filmLinkApi.fetchFilmProcesses,
    staleTime: CATALOG_STALE_TIME_MS,
  });

  const formatsQuery = useQuery({
    queryKey: filmLinkQueryKeys.catalogs.formats(),
    queryFn: filmLinkApi.fetchFilmFormats,
    staleTime: CATALOG_STALE_TIME_MS,
  });

  const serviceTypesQuery = useQuery({
    queryKey: filmLinkQueryKeys.catalogs.serviceTypes(),
    queryFn: filmLinkApi.fetchServiceTypes,
    staleTime: CATALOG_STALE_TIME_MS,
  });

  const labSearchParams = buildPublicLabSearchParams({
    processId: selectedProcessId,
    formatId: selectedFormatId,
    serviceTypeId: selectedServiceTypeId,
    sort: sortMode,
    size: 20,
  });

  const labsQuery = useQuery({
    queryKey: filmLinkQueryKeys.labs.list(labSearchParams),
    queryFn: () => filmLinkApi.searchPublicFilmLabs(labSearchParams),
    staleTime: SIGNED_URL_STALE_TIME_MS,
  });

  const labDetailQuery = useQuery({
    queryKey: filmLinkQueryKeys.labs.detail(activeLabId ?? 0),
    queryFn: () => filmLinkApi.fetchPublicFilmLabDetail(activeLabId ?? 0),
    enabled: activeLabId !== null,
    staleTime: SIGNED_URL_STALE_TIME_MS,
  });

  const filteredLabs = filterPublicLabSummaries(labsQuery.data?.content ?? [], search);
  const resolvedLab = labDetailQuery.data ?? null;
  const resolvedPackage = resolveSelectedPackage(resolvedLab, selectedPackage);
  const activeError = resolveActiveServiceError(
    activeLabId,
    [labsQuery.error, processesQuery.error, formatsQuery.error, serviceTypesQuery.error],
    labDetailQuery.error,
  );
  const isDetailLoadingForBooking =
    activeTab === 'booking' && activeLabId !== null && labDetailQuery.isLoading;

  const handleTabChange = (nextTab: 'directory' | 'booking') => {
    setTabOverride(nextTab);
    updateDraft((prev) => ({ ...prev, activeTab: nextTab }));
  };

  const handleInspectLab = (labId: number) => {
    setSelectedLabIdOverride(labId);
    setSelectedPackage(null);
    updateDraft((prev) => ({ ...prev, selectedLabId: labId }));
  };

  const handleSelectPackage = (lab: PublicFilmLabResponse, pkg: PublicServicePackage) => {
    setSelectedLabIdOverride(lab.id);
    setSelectedPackage(pkg);
    setTabOverride('booking');
    updateDraft((prev) => ({ ...prev, activeTab: 'booking', selectedLabId: lab.id }));
  };

  const handleSearchChange = (nextSearch: string) => {
    setSearch(nextSearch);
    updateDraft((prev) => ({ ...prev, search: nextSearch }));
  };

  const handleProcessChange = (processId: number | 'ALL') => {
    setSelectedProcessId(processId);
    updateDraft((prev) => ({ ...prev, processId }));
  };

  const handleFormatChange = (formatId: number | 'ALL') => {
    setSelectedFormatId(formatId);
    updateDraft((prev) => ({ ...prev, formatId }));
  };

  const handleServiceTypeChange = (serviceTypeId: number | 'ALL') => {
    setSelectedServiceTypeId(serviceTypeId);
    updateDraft((prev) => ({ ...prev, serviceTypeId }));
  };

  const handleSortChange = (sort: 'default' | 'price') => {
    setSortMode(sort);
    updateDraft((prev) => ({ ...prev, sort }));
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedProcessId('ALL');
    setSelectedFormatId('ALL');
    setSelectedServiceTypeId('ALL');
    setSortMode('default');
    void clearDraft();
  };

  const handleRestoreDirectoryDraft = () => {
    const restored = restoreDraft();
    if (!restored) {
      return;
    }
    setTabOverride(restored.activeTab);
    setSelectedLabIdOverride(restored.selectedLabId);
    setSearch(restored.search);
    setSelectedProcessId(restored.processId);
    setSelectedFormatId(restored.formatId);
    setSelectedServiceTypeId(restored.serviceTypeId);
    setSortMode(restored.sort);
  };

  const handleRetry = () => {
    refetchErroredServiceQueries([
      labsQuery,
      processesQuery,
      formatsQuery,
      serviceTypesQuery,
      ...(activeLabId !== null ? [labDetailQuery] : []),
    ]);
  };

  const handleOrderCreated = () => {
    setSelectedPackage(null);
    setSelectedLabIdOverride(null);
    void clearDraft();
    router.push('/(tabs)/orders');
  };

  return (
    <Screen testID="services.screen" scroll edges="top">
      <VStack gap="md">
        <VStack gap="none" className="pt-2">
          <Text variant="title">Dịch vụ Phòng Lab</Text>
          <Text variant="caption" tone="muted">
            Tìm phòng tối xác minh & Đặt lịch tráng scan
          </Text>
        </VStack>

        <SegmentedControl
          testIDPrefix="services.tab"
          options={[
            { value: 'directory', label: 'Danh bạ Lab', count: filteredLabs.length },
            { value: 'booking', label: 'Phiếu đặt tráng scan' },
          ]}
          value={activeTab}
          onChange={handleTabChange}
        />

        <ServicesStatusBanner
          error={activeError}
          isLoading={labsQuery.isLoading || isDetailLoadingForBooking}
          onRetry={handleRetry}
        />

        {activeTab === 'directory' ? (
          <VStack gap="md">
            <DraftRecoveryBanner
              testID="services.directory.draft-recovery"
              visible={hasRecoverableDraft && activeTab === 'directory'}
              pendingRetry={pendingRetry}
              lastErrorDetail={lastErrorDetail}
              lastSavedAt={lastSavedAt}
              onRestore={handleRestoreDirectoryDraft}
              onDiscard={() => void clearDraft()}
            />
            <ServicesDirectorySection
              search={search}
              onChangeSearch={handleSearchChange}
              selectedProcessId={selectedProcessId}
              onChangeProcessId={handleProcessChange}
              selectedFormatId={selectedFormatId}
              onChangeFormatId={handleFormatChange}
              selectedServiceTypeId={selectedServiceTypeId}
              onChangeServiceTypeId={handleServiceTypeChange}
              sortMode={sortMode}
              onChangeSortMode={handleSortChange}
              processOptions={buildCatalogFilterOptions(
                'Tất cả quy trình',
                processesQuery.data ?? [],
              )}
              formatOptions={buildCatalogFilterOptions('Mọi khổ phim', formatsQuery.data ?? [])}
              serviceTypeOptions={buildCatalogFilterOptions(
                'Tất cả dịch vụ',
                serviceTypesQuery.data ?? [],
              )}
              filteredLabs={filteredLabs}
              activeLabId={activeLabId}
              labDetail={resolvedLab}
              isLoadingLabs={labsQuery.isLoading}
              isLoadingDetail={labDetailQuery.isLoading}
              hasError={Boolean(activeError)}
              selectedPackageId={resolvedPackage?.id ?? null}
              onResetFilters={handleResetFilters}
              onInspectLab={handleInspectLab}
              onSelectPackage={handleSelectPackage}
            />
          </VStack>
        ) : (
          <BookingWizardSection
            selectedLab={resolvedLab}
            selectedPackage={resolvedPackage}
            onChooseLab={() => handleTabChange('directory')}
            onOrderCreated={handleOrderCreated}
          />
        )}
      </VStack>
    </Screen>
  );
}
