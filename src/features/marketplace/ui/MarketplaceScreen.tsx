import { useState } from 'react';
import { CATEGORY_OPTIONS, filmLinkStore } from '@/shared/domain';
import { useStore } from '@/shared/lib';
import { EmptyState, FilterChipGroup, Screen, SegmentedControl, Text, VStack } from '@/shared/ui';
import { filterListingsByCategory } from '../model/marketplace';
import { ConsignmentFormSection } from './ConsignmentFormSection';
import { ListingCardSection } from './ListingCardSection';

export function MarketplaceScreen() {
  const listings = useStore(filmLinkStore, (state) => state.listings);
  const [activeTab, setActiveTab] = useState<'catalog' | 'consign'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  const visibleListings = filterListingsByCategory(listings, selectedCategory);

  return (
    <Screen testID="marketplace.screen" scroll edges="top">
      <VStack gap="md">
        <VStack gap="none" className="pt-2">
          <Text variant="title">Chợ ký gửi Thiết bị</Text>
          <Text variant="caption" tone="muted">
            Thiết bị máy ảnh kiểm định Lab & Thương lượng giá
          </Text>
        </VStack>
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
