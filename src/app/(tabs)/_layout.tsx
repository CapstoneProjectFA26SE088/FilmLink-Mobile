import { Tabs } from 'expo-router';
import { authStore, Role } from '@/shared/domain';
import { useStore } from '@/shared/lib';
import { aiTabScreenOptions, tabScreenOptions, useTabScreenTheme } from '@/shared/ui';

export default function TabsLayout() {
  const isExpert = useStore(authStore, (s) => s.user?.role === Role.PHOTOGRAPHY_EXPERT);
  const screenOptions = useTabScreenTheme();

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="index" options={tabScreenOptions('Trang chủ', 'home-outline')} />
      <Tabs.Screen name="services" options={tabScreenOptions('Dịch vụ', 'color-filter-outline')} />
      <Tabs.Screen name="orders" options={tabScreenOptions('Đơn hàng', 'receipt-outline')} />
      <Tabs.Screen name="ai" options={aiTabScreenOptions()} />
      <Tabs.Screen name="marketplace" options={tabScreenOptions('Chợ phim', 'pricetag-outline')} />
      <Tabs.Screen name="community" options={tabScreenOptions('Cộng đồng', 'people-outline')} />
      <Tabs.Screen name="profile" options={tabScreenOptions('Hồ sơ', 'person-outline')} />
      <Tabs.Screen
        name="expert"
        options={tabScreenOptions('Chuyên gia', 'sparkles-outline', isExpert ? undefined : null)}
      />
    </Tabs>
  );
}
