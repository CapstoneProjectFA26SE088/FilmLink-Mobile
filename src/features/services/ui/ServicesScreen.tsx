import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  draftStore,
  type FilmFormat,
  type FilmLab,
  type FilmProcess,
  FORMAT_FILTERS,
  filmLinkStore,
  PROCESS_FILTERS,
  type ServicePackage,
  selectLabPackageForBooking,
} from '@/shared/domain';
import { formatVnd, useStore } from '@/shared/lib';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FilterChipGroup,
  HStack,
  Icon,
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
      <VStack gap="md">
        <HStack justify="between" align="start">
          <VStack gap="none" className="flex-1 pr-2">
            <HStack gap="xs" align="center">
              <Text variant="heading">{lab.name}</Text>
              <Icon name="checkmark-circle" size="xs" tone="brand" />
            </HStack>
            <Text variant="caption" tone="muted">
              {lab.address}
            </Text>
          </VStack>
          <Badge
            label={`★ ${lab.rating} (${lab.reviewCount})`}
            tone="success"
            icon={<Icon name="star" size="xs" tone="success" />}
          />
        </HStack>
        <Text variant="body" tone="secondary">
          {lab.description}
        </Text>
        <VStack gap="xs">
          {lab.packages.map((pkg) => {
            const isSelected = pkg.id === selectedPackageId;
            return (
              <Card key={pkg.id} tone={isSelected ? 'brand' : 'muted'} className="p-3">
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
      </VStack>
    </Card>
  );
}

export function ServicesScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const labs = useStore(filmLinkStore, (state) => state.labs);
  const selectedPackageId = useStore(draftStore, (state) => state.bookingDraft.packageId);

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

        {activeTab === 'directory' ? (
          <VStack gap="md">
            <Input
              testID="services.search"
              value={search}
              onChangeText={setSearch}
              placeholder="Tìm theo tên Phòng Lab hoặc thành phố..."
              icon={<Icon name="search-outline" size="sm" tone="muted" />}
            />

            <FilterChipGroup
              testIDPrefix="services.process"
              label="Hóa chất tráng (Process)"
              options={PROCESS_FILTERS}
              value={process}
              onChange={setProcess}
              scrollable
            />

            <FilterChipGroup
              testIDPrefix="services.format"
              label="Khổ phim (Film Format)"
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
                icon={<Icon name="search" size="lg" tone="muted" />}
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
