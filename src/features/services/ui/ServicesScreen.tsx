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
import { formatVnd } from '@/shared/lib';
import {
  Alert,
  Badge,
  Button,
  Card,
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
  processOptions,
  formatOptions,
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
  readonly processOptions: readonly { readonly value: string; readonly label: string }[];
  readonly formatOptions: readonly { readonly value: string; readonly label: string }[];
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

      {!isLoadingLabs && !hasError && filteredLabs.length === 0 ? (
        <EmptyState
          testID="services.empty"
          actionTestID="services.reset-filters"
          title="Không tìm thấy Phòng Lab phù hợp"
          description="Hãy thử đặt lại bộ lọc quy trình hóa chất hoặc khổ phim."
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

export function ServicesScreen() {
  const params = useLocalSearchParams<{ tab?: string; labId?: string }>();
  const paramLabId = parsePositiveId(params.labId);

  const [tabOverride, setTabOverride] = useState<'directory' | 'booking' | null>(null);
  const [selectedLabIdOverride, setSelectedLabIdOverride] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PublicServicePackage | null>(null);
  const [search, setSearch] = useState('');
  const [selectedProcessId, setSelectedProcessId] = useState<number | 'ALL'>('ALL');
  const [selectedFormatId, setSelectedFormatId] = useState<number | 'ALL'>('ALL');

  const activeTab = tabOverride ?? (params.tab === 'booking' ? 'booking' : 'directory');
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

  const labSearchParams = buildPublicLabSearchParams({
    processId: selectedProcessId,
    formatId: selectedFormatId,
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
  const activeError =
    labsQuery.error ??
    processesQuery.error ??
    formatsQuery.error ??
    (activeLabId !== null ? labDetailQuery.error : null);
  const isDetailLoadingForBooking =
    activeTab === 'booking' && activeLabId !== null && labDetailQuery.isLoading;

  const handleInspectLab = (labId: number) => {
    setSelectedLabIdOverride(labId);
    setSelectedPackage(null);
  };

  const handleSelectPackage = (lab: PublicFilmLabResponse, pkg: PublicServicePackage) => {
    setSelectedLabIdOverride(lab.id);
    setSelectedPackage(pkg);
    setTabOverride('booking');
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedProcessId('ALL');
    setSelectedFormatId('ALL');
  };

  const handleRetry = () => {
    for (const query of [labsQuery, processesQuery, formatsQuery]) {
      if (query.isError) {
        void query.refetch();
      }
    }
    if (activeLabId !== null && labDetailQuery.isError) {
      void labDetailQuery.refetch();
    }
  };

  const handleOrderCreated = () => {
    setSelectedPackage(null);
    setSelectedLabIdOverride(null);
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
          onChange={setTabOverride}
        />

        <ServicesStatusBanner
          error={activeError}
          isLoading={labsQuery.isLoading || isDetailLoadingForBooking}
          onRetry={handleRetry}
        />

        {activeTab === 'directory' ? (
          <ServicesDirectorySection
            search={search}
            onChangeSearch={setSearch}
            selectedProcessId={selectedProcessId}
            onChangeProcessId={setSelectedProcessId}
            selectedFormatId={selectedFormatId}
            onChangeFormatId={setSelectedFormatId}
            processOptions={buildCatalogFilterOptions(
              'Tất cả quy trình',
              processesQuery.data ?? [],
            )}
            formatOptions={buildCatalogFilterOptions('Mọi khổ phim', formatsQuery.data ?? [])}
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
        ) : (
          <BookingWizardSection
            selectedLab={resolvedLab}
            selectedPackage={resolvedPackage}
            onChooseLab={() => setTabOverride('directory')}
            onOrderCreated={handleOrderCreated}
          />
        )}
      </VStack>
    </Screen>
  );
}
