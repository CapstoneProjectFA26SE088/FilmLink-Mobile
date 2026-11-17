import { router } from 'expo-router';
import {
  authStore,
  checkRoleCapabilities,
  type FilmLab,
  filmLinkStore,
  PROCESSING_STAGE_LABELS,
  Role,
  selectLabPackageForBooking,
  switchUserRole,
} from '@/shared/domain';
import { formatVnd, useStore } from '@/shared/lib';
import { AppHeader, Badge, Button, Card, HStack, Screen, Text, VStack } from '@/shared/ui';
import { extractFirstName, summarizeDashboardOrders } from '../model/home';

export function HomeScreen() {
  const user = useStore(authStore, (state) => state.user);
  const orders = useStore(filmLinkStore, (state) => state.orders);
  const labs = useStore(filmLinkStore, (state) => state.labs);
  const articles = useStore(filmLinkStore, (state) => state.articles);
  const workshops = useStore(filmLinkStore, (state) => state.workshops);

  const { isExpert } = checkRoleCapabilities(user?.role ?? Role.PHOTOGRAPHER);
  const firstName = extractFirstName(user?.fullName);
  const { activeOrdersCount, completedOrdersCount, primaryActiveOrder } =
    summarizeDashboardOrders(orders);

  const handleToggleRole = () => {
    switchUserRole(isExpert ? Role.PHOTOGRAPHER : Role.PHOTOGRAPHY_EXPERT);
  };

  const handleQuickBookLab = (lab: FilmLab) => {
    const defaultPkg = lab.packages[0];
    if (defaultPkg) {
      selectLabPackageForBooking(lab, defaultPkg);
    }
    router.push({ pathname: '/(tabs)/services', params: { tab: 'booking' } });
  };

  return (
    <Screen
      testID="home.screen"
      scroll
      edges="top"
      header={
        <AppHeader
          title={`Chào ${firstName}`}
          subtitle="Không gian nhiếp ảnh phim FilmLink"
          isExpert={isExpert}
        />
      }
    >
      <VStack gap="md">
        <Card tone={isExpert ? 'brand' : 'muted'}>
          <VStack gap="sm">
            <HStack justify="between" align="center">
              <Badge
                label={isExpert ? 'PHOTOGRAPHY EXPERT (BR-05)' : 'PHOTOGRAPHER (BR-01)'}
                tone={isExpert ? 'brand' : 'neutral'}
              />
              <Button
                testID="home.toggle-role"
                label={isExpert ? 'Về Photographer' : 'Thử Expert'}
                variant="outline"
                size="sm"
                onPress={handleToggleRole}
              />
            </HStack>
            <Text variant="heading">
              {isExpert
                ? 'Đã mở khóa Expert Studio, Knowledge Base & Workshop'
                : 'Nâng cấp Chuyên gia để xuất bản cẩm nang & tổ chức Workshop'}
            </Text>
            {!isExpert ? (
              <Button
                testID="home.open-upgrade"
                label="Nộp hồ sơ Chuyên gia (UC11)"
                variant="secondary"
                size="sm"
                onPress={() => router.push('/(modals)/expert-upgrade')}
              />
            ) : null}
          </VStack>
        </Card>

        <HStack gap="sm">
          <Card className="flex-1">
            <VStack gap="xs">
              <Text variant="caption" tone="muted">
                Đơn đang xử lý
              </Text>
              <Text variant="title" tone="brand">
                {activeOrdersCount}
              </Text>
            </VStack>
          </Card>
          <Card className="flex-1">
            <VStack gap="xs">
              <Text variant="caption" tone="muted">
                Lưu trữ số (BR-08)
              </Text>
              <Text variant="title" tone="success">
                {completedOrdersCount}
              </Text>
            </VStack>
          </Card>
        </HStack>

        <HStack gap="sm">
          <Button
            testID="home.open-ai"
            label={`Trợ lý AI (${articles.length} KB)`}
            variant="secondary"
            size="sm"
            className="flex-1"
            onPress={() => router.push('/(modals)/ai-advisor')}
          />
          <Button
            testID="home.open-expert"
            label={`Workshop (${workshops.length})`}
            variant="outline"
            size="sm"
            className="flex-1"
            onPress={() => router.push('/(tabs)/expert')}
          />
        </HStack>

        {primaryActiveOrder ? (
          <Card tone="elevated">
            <VStack gap="xs">
              <HStack justify="between" align="center">
                <Text variant="secondary" tone="brand">
                  Đơn đang xử lý: {primaryActiveOrder.id}
                </Text>
                <Badge label={`${primaryActiveOrder.progress}%`} tone="info" />
              </HStack>
              <Text variant="heading">{primaryActiveOrder.filmStock}</Text>
              <Text variant="caption" tone="secondary">
                {primaryActiveOrder.labName} · {PROCESSING_STAGE_LABELS[primaryActiveOrder.stage]}
              </Text>
              <Button
                testID="home.open-orders"
                label="Theo dõi tiến độ"
                variant="outline"
                size="sm"
                onPress={() => router.push('/(tabs)/orders')}
              />
            </VStack>
          </Card>
        ) : null}

        <HStack justify="between" align="center">
          <Text variant="section">Phòng Lab xác minh ({labs.length})</Text>
          <Button
            testID="home.open-services"
            label="Xem tất cả"
            variant="ghost"
            size="sm"
            onPress={() => router.push('/(tabs)/services')}
          />
        </HStack>

        {labs.map((lab) => {
          const basePrice = lab.packages[0]?.priceVnd ?? 75_000;
          return (
            <Card key={lab.id}>
              <VStack gap="xs">
                <HStack justify="between" align="center">
                  <Text variant="heading">{lab.name}</Text>
                  <Badge label={`★ ${lab.rating}`} tone="success" />
                </HStack>
                <Text variant="caption" tone="secondary">
                  {lab.city} · {lab.turnaroundSummary}
                </Text>
                <HStack justify="between" align="center">
                  <Text variant="secondary" tone="brand">
                    Từ {formatVnd(basePrice)}
                  </Text>
                  <Button
                    testID={`home.book.${lab.id}`}
                    label="Đặt nhanh"
                    variant="primary"
                    size="sm"
                    onPress={() => handleQuickBookLab(lab)}
                  />
                </HStack>
              </VStack>
            </Card>
          );
        })}
      </VStack>
    </Screen>
  );
}
