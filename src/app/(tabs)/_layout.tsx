import { Tabs } from 'expo-router';
import { authStore, checkRoleCapabilities, Role } from '@/shared/domain';
import { useStore } from '@/shared/lib';
import { useTheme } from '@/shared/theme';

export default function TabsLayout() {
  const { palette } = useTheme();
  const role = useStore(authStore, (state) => state.user?.role ?? Role.PHOTOGRAPHER);
  const { isExpert } = checkRoleCapabilities(role);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.brand,
        tabBarInactiveTintColor: palette.textSecondary,
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Trang chủ' }} />
      <Tabs.Screen name="services" options={{ title: 'Đặt dịch vụ' }} />
      <Tabs.Screen name="orders" options={{ title: 'Đơn hàng' }} />
      <Tabs.Screen name="marketplace" options={{ title: 'Chợ ký gửi' }} />
      <Tabs.Screen name="community" options={{ title: 'Cộng đồng' }} />
      <Tabs.Screen
        name="expert"
        options={{ href: isExpert ? '/(tabs)/expert' : null, title: 'Chuyên gia' }}
      />
    </Tabs>
  );
}
