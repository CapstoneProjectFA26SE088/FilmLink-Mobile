import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  authStore,
  checkRoleCapabilities,
  draftStore,
  type FilmFormat,
  type FilmLab,
  type FilmProcess,
  FORMAT_FILTERS,
  filmLinkStore,
  PROCESS_FILTERS,
  Role,
  type ServicePackage,
  selectLabPackageForBooking,
} from '@/shared/domain';
import { formatVnd, useStore } from '@/shared/lib';
import {
  AppHeader,
  Badge,
  Button,
  Card,
  EmptyState,
  FilterChipGroup,
  HStack,
  Input,
  Screen,
  SegmentedControl,
  Text,
  VStack,
} from '@/shared/ui';
import { filterLabs } from '../model/services';
import { BookingWizardSection } from './BookingWizardSection';

function LabPackageCard({
  lab,
  selectedPackageId,
  onSelect,
}: {
  readonly lab: FilmLab;
  readonly selectedPackageId: string;
  readonly onSelect: (lab: FilmLab, pkg: ServicePackage) => void;
}) {
  return (
    <Card>
      <VStack gap="sm">
        <HStack justify="between" align="center">
          <VStack gap="none" className="flex-1">
            <Text variant="heading">{lab.name}</Text>
            <Text variant="caption" tone="muted">
              {lab.address}
            </Text>
          </VStack>
          <Badge label={`★ ${lab.rating} (${lab.reviewCount})`} tone="success" />
        </HStack>
        <Text variant="secondary" tone="secondary">
          {lab.description}
        </Text>
        {lab.packages.map((pkg) => {
          const isSelected = pkg.id === selectedPackageId;
          return (
            <Card key={pkg.id} tone={isSelected ? 'brand' : 'muted'}>
              <HStack justify="between" align="center" gap="sm">
                <VStack gap="none" className="flex-1">
                  <Text variant="secondary">{pkg.name}</Text>
                  <Text variant="caption" tone="muted">
                    {pkg.turnaroundDays} · {pkg.resolutionDpi}
                  </Text>
                </VStack>
                <Button
                  testID={`services.pkg.${pkg.id}`}
                  label={formatVnd(pkg.priceVnd)}
                  size="sm"
                  variant={isSelected ? 'primary' : 'outline'}
                  onPress={() => onSelect(lab, pkg)}
                />
              </HStack>
            </Card>
          );
        })}
      </VStack>
    </Card>
  );
}

export function ServicesScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const labs = useStore(filmLinkStore, (state) => state.labs);
  const selectedPackageId = useStore(draftStore, (state) => state.bookingDraft.packageId);
  const userRole = useStore(authStore, (state) => state.user?.role ?? Role.PHOTOGRAPHER);
  const { isExpert } = checkRoleCapabilities(userRole);

  const [tabOverride, setTabOverride] = useState<'directory' | 'booking' | null>(null);
  const activeTab = tabOverride ?? (params.tab === 'booking' ? 'booking' : 'directory');

  const [search, setSearch] = useState('');
  const [process, setProcess] = useState<FilmProcess | 'ALL'>('ALL');
  const [format, setFormat] = useState<FilmFormat | 'ALL'>('ALL');

  const filteredLabs = filterLabs(labs, { search, process, format });

  const handleSelectPackage = (lab: FilmLab, pkg: ServicePackage) => {
    selectLabPackageForBooking(lab, pkg);
    setTabOverride('booking');
  };

  return (
    <Screen
      testID="services.screen"
      scroll
      edges="top"
      header={
        <AppHeader
          title="Đặt dịch vụ Phòng Lab"
          subtitle="Tìm phòng tối xác minh & Đặt lịch tráng scan"
          isExpert={isExpert}
        />
      }
    >
      <VStack gap="md">
        <SegmentedControl
          testIDPrefix="services.tab"
          options={[
            { value: 'directory', label: 'Danh bạ Lab', count: filteredLabs.length },
            { value: 'booking', label: 'Phiếu đặt tráng scan' },
          ]}
          value={activeTab}
          onChange={setTabOverride}
        />

        {activeTab === 'directory' ? (
          <VStack gap="md">
            <Input
              testID="services.search"
              value={search}
              onChangeText={setSearch}
              placeholder="Tìm theo tên Phòng Lab hoặc thành phố (TP.HCM, Hà Nội)..."
            />

            <FilterChipGroup
              testIDPrefix="services.process"
              label="Lọc theo hóa chất tráng (Process)"
              options={PROCESS_FILTERS}
              value={process}
              onChange={setProcess}
              scrollable
            />

            <FilterChipGroup
              testIDPrefix="services.format"
              label="Lọc theo khổ phim (Film Format)"
              options={FORMAT_FILTERS}
              value={format}
              onChange={setFormat}
              scrollable
            />

            {filteredLabs.length === 0 ? (
              <EmptyState
                testID="services.empty"
                actionTestID="services.reset-filters"
                title="Không tìm thấy Phòng Lab phù hợp"
                description="Hãy thử đặt lại bộ lọc quy trình hóa chất hoặc khổ phim."
                actionLabel="Xóa bộ lọc"
                onAction={() => {
                  setSearch('');
                  setProcess('ALL');
                  setFormat('ALL');
                }}
              />
            ) : (
              filteredLabs.map((lab) => (
                <LabPackageCard
                  key={lab.id}
                  lab={lab}
                  selectedPackageId={selectedPackageId}
                  onSelect={handleSelectPackage}
                />
              ))
            )}
          </VStack>
        ) : (
          <BookingWizardSection onOrderCreated={() => router.push('/(tabs)/orders')} />
        )}
      </VStack>
    </Screen>
  );
}
