import { router } from 'expo-router';
import type { FilmArchiveRollSummaryResponse } from '@/shared/api';
import { formatDateVn } from '@/shared/lib';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  HStack,
  Icon,
  MediaImage,
  Text,
  VStack,
} from '@/shared/ui';
import { mapOrderApiError } from '../model/orders';

function ArchiveRollSummaryCard({ roll }: { readonly roll: FilmArchiveRollSummaryResponse }) {
  const stockTitle = roll.filmStockName ?? 'Dòng phim không còn trong danh mục';
  const formatTitle = roll.filmFormatName ?? 'Khổ phim';

  return (
    <Card>
      <VStack gap="sm">
        <HStack justify="between" align="center" gap="sm">
          <VStack gap="none" className="flex-1">
            <Text variant="heading">{stockTitle}</Text>
            <Text variant="caption" tone="muted">
              {roll.orderCode} · Cuộn #{roll.rollSequence} · {roll.labName}
            </Text>
          </VStack>
          <Badge label={`${roll.previewCount} ảnh`} tone="brand" />
        </HStack>

        {roll.coverPreviewUrl ? (
          <MediaImage
            uri={roll.coverPreviewUrl}
            accessibilityLabel={`Ảnh bìa cuộn phim ${roll.orderCode} #${roll.rollSequence}`}
          />
        ) : null}

        <HStack justify="between" align="center">
          <Text variant="caption" tone="secondary">
            {formatTitle} · Giao {formatDateVn(roll.deliveredAt)}
          </Text>
          <Button
            testID={`orders.archive.open.${roll.archiveRollId}`}
            label="Xem chi tiết"
            size="sm"
            variant="primary"
            onPress={() =>
              router.push({
                pathname: '/archive/[archiveRollId]',
                params: { archiveRollId: String(roll.archiveRollId) },
              })
            }
          />
        </HStack>
      </VStack>
    </Card>
  );
}

export function ArchiveSection({
  rolls,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  error,
  onRetry,
  onLoadMore,
  onGoServices,
}: {
  readonly rolls: readonly FilmArchiveRollSummaryResponse[];
  readonly isLoading: boolean;
  readonly isFetchingNextPage: boolean;
  readonly hasNextPage: boolean;
  readonly error: unknown;
  readonly onRetry: () => void;
  readonly onLoadMore: () => void;
  readonly onGoServices: () => void;
}) {
  return (
    <VStack gap="md">
      {isLoading ? (
        <Card testID="orders.archive.loading" tone="muted">
          <Text variant="secondary" tone="muted">
            Đang tải Lưu trữ số cuộn phim...
          </Text>
        </Card>
      ) : null}

      {error ? (
        <VStack gap="sm">
          <Alert testID="orders.archive.error" tone="danger" message={mapOrderApiError(error)} />
          <Button
            testID="orders.archive.retry"
            label="Thử lại"
            variant="outline"
            size="sm"
            onPress={onRetry}
          />
        </VStack>
      ) : null}

      {!isLoading && !error && rolls.length === 0 ? (
        <EmptyState
          testID="orders.archive.empty"
          actionTestID="orders.archive.go-services"
          title="Chưa có cuộn phim nào trong Lưu trữ số"
          description="Khi Phòng Lab giao file scan ở bước QC, ảnh xem trước và link full-res sẽ tự động xuất hiện tại đây."
          actionLabel="Đặt tráng & scan ngay"
          icon={<Icon name="images-outline" size="xl" tone="muted" />}
          onAction={onGoServices}
        />
      ) : null}

      {rolls.map((roll) => (
        <ArchiveRollSummaryCard key={roll.archiveRollId} roll={roll} />
      ))}

      {hasNextPage ? (
        <Button
          testID="orders.archive.load-more"
          label={isFetchingNextPage ? 'Đang tải thêm...' : 'Tải thêm cuộn phim'}
          variant="outline"
          size="md"
          loading={isFetchingNextPage}
          onPress={onLoadMore}
        />
      ) : null}
    </VStack>
  );
}
