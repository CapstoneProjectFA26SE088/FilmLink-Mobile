import { useState } from 'react';
import {
  authStore,
  CATEGORY_OPTIONS,
  checkRoleCapabilities,
  filmLinkStore,
  Role,
} from '@/shared/domain';
import { useStore } from '@/shared/lib';
import {
  AppHeader,
  EmptyState,
  FilterChipGroup,
  Screen,
  SegmentedControl,
  VStack,
} from '@/shared/ui';
import { filterListingsByCategory } from '../model/marketplace';
import { ConsignmentFormSection } from './ConsignmentFormSection';
import { ListingCardSection } from './ListingCardSection';

export function MarketplaceScreen() {
  const listings = useStore(filmLinkStore, (state) => state.listings);
  const userRole = useStore(authStore, (state) => state.user?.role ?? Role.PHOTOGRAPHER);
  const { isExpert } = checkRoleCapabilities(userRole);

  const [activeTab, setActiveTab] = useState<'catalog' | 'consign'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  const visibleListings = filterListingsByCategory(listings, selectedCategory);

  return (
    <Screen
      testID="marketplace.screen"
      scroll
      edges="top"
      header={
        <AppHeader
          title="Chợ ký gửi Thiết bị"
          subtitle="Kiểm định Lab (BR-51) & Trả giá 3 vòng (BR-52)"
          isExpert={isExpert}
        />
      }
    >
      <VStack gap="md">
        <SegmentedControl
          testIDPrefix="marketplace.tab"
          options={[
            { value: 'catalog', label: 'Kệ hàng đã kiểm định', count: visibleListings.length },
            { value: 'consign', label: 'Đăng ký ký gửi mới' },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'catalog' ? (
          <VStack gap="md">
            <FilterChipGroup
              testIDPrefix="marketplace.category"
              label="Lọc theo nhóm thiết bị analog"
              options={CATEGORY_OPTIONS}
              value={selectedCategory}
              onChange={setSelectedCategory}
              scrollable
            />
            {visibleListings.length === 0 ? (
              <EmptyState
                testID="marketplace.empty"
                actionTestID="marketplace.reset-category"
                title="Chưa có thiết bị trong danh mục này"
                description="Chọn danh mục khác hoặc đăng ký ký gửi thiết bị của bạn."
                actionLabel="Xem tất cả thiết bị"
                onAction={() => setSelectedCategory('Tất cả')}
              />
            ) : (
              visibleListings.map((item) => <ListingCardSection key={item.id} item={item} />)
            )}
          </VStack>
        ) : (
          <ConsignmentFormSection onSuccess={() => setActiveTab('catalog')} />
        )}
      </VStack>
    </Screen>
  );
}
