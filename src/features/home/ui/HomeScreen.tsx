import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
  filmLinkApi,
  filmLinkQueryKeys,
  ORDER_STALE_TIME_MS,
  type PublicFilmLabSummaryResponse,
  type ServiceOrderSummaryResponse,
  SIGNED_URL_STALE_TIME_MS,
} from '@/shared/api';
import {
  authStore,
  checkRoleCapabilities,
  Role,
  SERVICE_ORDER_STATUS_LABELS,
} from '@/shared/domain';
import { formatVnd, useStore } from '@/shared/lib';
import { Alert, Badge, Button, Card, HStack, Icon, Screen, Text, VStack } from '@/shared/ui';
import { extractFirstName, mapHomeApiError, summarizeDashboardOrders } from '../model/home';

function HomeHeader({
  firstName,
  isExpert,
}: {
  readonly firstName: string;
  readonly isExpert: boolean;
}) {
  return (
    <HStack justify="between" align="center" className="pt-2">
      <VStack gap="none">
        <Text variant="title">Chào {firstName}</Text>
        <Text variant="caption" tone="muted">
          Không gian nhiếp ảnh phim FilmLink
        </Text>
      </VStack>
      <Badge
        label={isExpert ? 'Chuyên gia' : 'Nhiếp ảnh gia'}
        tone={isExpert ? 'brand' : 'neutral'}
        icon={
          <Icon
            name={isExpert ? 'sparkles' : 'camera-outline'}
            size="xs"
            tone={isExpert ? 'brand' : 'secondary'}
          />
        }
      />
    </HStack>
  );
}

function HomeRoleCard({ isExpert }: { readonly isExpert: boolean }) {
  return (
    <Card tone={isExpert ? 'brand' : 'muted'}>
      <VStack gap="sm">
        <HStack justify="between" align="center">
          <Badge
            label={isExpert ? 'Chuyên gia Nhiếp ảnh' : 'Nhiếp ảnh gia'}
            tone={isExpert ? 'brand' : 'neutral'}
            icon={
              <Icon
                name={isExpert ? 'sparkles' : 'camera-outline'}
                size="xs"
                tone={isExpert ? 'brand' : 'secondary'}
              />
            }
          />
        </HStack>
        <Text variant="heading">
          {isExpert
            ? 'Đã mở khóa Expert Studio, Thư viện kiến thức & Tổ chức Workshop'
            : 'Nâng cấp Chuyên gia để xuất bản cẩm nang & tổ chức Workshop'}
        </Text>
        {!isExpert ? (
          <Button
            testID="home.open-upgrade"
            label="Nộp hồ sơ Chuyên gia"
            variant="secondary"
            size="sm"
            onPress={() => router.push('/(modals)/expert-upgrade')}
          />
        ) : null}
      </VStack>
    </Card>
  );
}

function HomeOrderMetricsRow({
  activeOrdersCount,
  completedOrdersCount,
}: {
  readonly activeOrdersCount: number;
  readonly completedOrdersCount: number;
}) {
  return (
    <HStack gap="sm">
      <Card className="flex-1">
        <VStack gap="xs">
          <HStack justify="between" align="center">
            <Text variant="caption" tone="muted">
              Đơn đang xử lý
            </Text>
            <Icon name="time-outline" size="xs" tone="brand" />
          </HStack>
          <Text variant="title" tone="brand">
            {activeOrdersCount}
          </Text>
        </VStack>
      </Card>
      <Card className="flex-1">
        <VStack gap="xs">
          <HStack justify="between" align="center">
            <Text variant="caption" tone="muted">
              Lưu trữ số trọn đời
            </Text>
            <Icon name="cloud-done-outline" size="xs" tone="success" />
          </HStack>
          <Text variant="title" tone="success">
            {completedOrdersCount}
          </Text>
        </VStack>
      </Card>
    </HStack>
  );
}

function HomeActiveOrderCard({ order }: { readonly order: ServiceOrderSummaryResponse }) {
  const displayAmount = order.finalTotalVnd ?? order.estimatedTotalVnd;

  return (
    <Card tone="elevated">
      <VStack gap="sm">
        <HStack justify="between" align="center">
          <HStack gap="xs" align="center">
            <Icon name="sync-outline" size="sm" tone="brand" />
            <Text variant="secondary" tone="brand">
              Đơn đang xử lý: {order.orderCode}
            </Text>
          </HStack>
          <Badge label={SERVICE_ORDER_STATUS_LABELS[order.status]} tone="info" />
        </HStack>
        <Text variant="heading">{order.labName}</Text>
        <HStack justify="between" align="center">
          <Text variant="caption" tone="secondary">
            {order.rollCount} cuộn phim
          </Text>
          <Text variant="secondary" tone="brand">
            {formatVnd(displayAmount)}
          </Text>
        </HStack>
        <Button
          testID="home.open-orders"
          label="Theo dõi tiến độ"
          variant="outline"
          size="sm"
          onPress={() => router.push('/(tabs)/orders')}
        />
      </VStack>
    </Card>
  );
}

function HomeFeaturedLabCard({
  lab,
  onQuickBook,
}: {
  readonly lab: PublicFilmLabSummaryResponse;
  readonly onQuickBook: (labId: number) => void;
}) {
  return (
    <Card>
      <VStack gap="xs">
        <HStack justify="between" align="center">
          <HStack gap="xs" align="center" className="flex-1 pr-2">
            <Text variant="heading">{lab.labName}</Text>
            <Icon name="checkmark-circle" size="xs" tone="brand" />
          </HStack>
          {lab.distanceKm != null ? (
            <Badge label={`${lab.distanceKm.toFixed(1)} km`} tone="info" />
          ) : null}
        </HStack>
        <Text variant="caption" tone="secondary">
          {lab.district}, {lab.province}
        </Text>
        <HStack justify="between" align="center" className="pt-2">
          <Text variant="secondary" tone="brand">
            Từ {formatVnd(lab.minPriceVnd)}
          </Text>
          <Button
            testID={`home.book.${lab.id}`}
            label="Đặt nhanh"
            variant="primary"
            size="sm"
            onPress={() => onQuickBook(lab.id)}
          />
        </HStack>
      </VStack>
    </Card>
  );
}

export function HomeScreen() {
  const user = useStore(authStore, (state) => state.user);
  const isAuthenticated = useStore(authStore, (state) => state.isAuthenticated);

  const labsQuery = useQuery({
    queryKey: filmLinkQueryKeys.labs.list({ size: 3 }),
    queryFn: () => filmLinkApi.searchPublicFilmLabs({ size: 3 }),
    staleTime: SIGNED_URL_STALE_TIME_MS,
  });

  const ordersQuery = useQuery({
    queryKey: filmLinkQueryKeys.orders.list({ size: 20 }),
    queryFn: () => filmLinkApi.fetchServiceOrders({ size: 20 }),
    enabled: isAuthenticated,
    staleTime: ORDER_STALE_TIME_MS,
  });

  const labs = labsQuery.data?.content ?? [];
  const orders = ordersQuery.data?.content ?? [];
  const { isExpert } = checkRoleCapabilities(user?.role ?? Role.PHOTOGRAPHER);
  const firstName = extractFirstName(user?.fullName);
  const { activeOrdersCount, completedOrdersCount, primaryActiveOrder } =
    summarizeDashboardOrders(orders);

  const isLoading = labsQuery.isLoading || (isAuthenticated && ordersQuery.isLoading);
  const activeError = labsQuery.error ?? ordersQuery.error;

  const handleQuickBookLab = (labId: number) => {
    router.push({ pathname: '/(tabs)/services', params: { tab: 'booking', labId: String(labId) } });
  };

  const handleRetry = () => {
    if (labsQuery.isError) {
      void labsQuery.refetch();
    }
    if (isAuthenticated && ordersQuery.isError) {
      void ordersQuery.refetch();
    }
  };

  return (
    <Screen testID="home.screen" scroll edges="top">
      <VStack gap="md">
        <HomeHeader firstName={firstName} isExpert={isExpert} />
        <HomeRoleCard isExpert={isExpert} />
        <HomeOrderMetricsRow
          activeOrdersCount={activeOrdersCount}
          completedOrdersCount={completedOrdersCount}
        />

        <HStack gap="sm">
          <Button
            testID="home.open-ai"
            label="Trợ lý AI"
            variant="secondary"
            size="sm"
            className="flex-1"
            icon={<Icon name="sparkles" size="xs" tone="brand" />}
            onPress={() => router.push('/(modals)/ai-advisor')}
          />
          <Button
            testID="home.open-expert"
            label="Expert Studio"
            variant="outline"
            size="sm"
            className="flex-1"
            icon={<Icon name="calendar-outline" size="xs" tone="default" />}
            onPress={() => router.push('/(tabs)/expert')}
          />
        </HStack>

        {activeError ? (
          <VStack gap="sm">
            <Alert testID="home.error" tone="danger" message={mapHomeApiError(activeError)} />
            <Button
              testID="home.retry"
              label="Thử lại"
              variant="outline"
              size="sm"
              onPress={handleRetry}
            />
          </VStack>
        ) : null}

        {isLoading ? (
          <Card testID="home.loading" tone="muted">
            <Text variant="secondary" tone="muted">
              Đang tải Phòng Lab và đơn hàng mới nhất...
            </Text>
          </Card>
        ) : null}

        {primaryActiveOrder ? <HomeActiveOrderCard order={primaryActiveOrder} /> : null}

        <HStack justify="between" align="center" className="pt-1">
          <Text variant="section">Phòng Lab xác minh ({labs.length})</Text>
          <Button
            testID="home.open-services"
            label="Xem tất cả"
            variant="ghost"
            size="sm"
            onPress={() => router.push('/(tabs)/services')}
          />
        </HStack>

        {!isLoading && !labsQuery.isError && labs.length === 0 ? (
          <Card tone="muted">
            <Text variant="secondary" tone="muted">
              Hiện chưa có Phòng Lab đối tác khả dụng.
            </Text>
          </Card>
        ) : null}

        {labs.map((lab) => (
          <HomeFeaturedLabCard key={lab.id} lab={lab} onQuickBook={handleQuickBookLab} />
        ))}
      </VStack>
    </Screen>
  );
}
