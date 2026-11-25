import { useQuery } from '@tanstack/react-query';
import { openURL } from 'expo-linking';
import { type Href, router, useLocalSearchParams } from 'expo-router';
import {
  type FilmArchiveRollResponse,
  filmLinkApi,
  filmLinkQueryKeys,
  SIGNED_URL_STALE_TIME_MS,
} from '@/shared/api';
import { firstRouteParam, formatDateTimeVn, formatDateVn, type RawRouteParam } from '@/shared/lib';
import {
  Alert,
  Badge,
  Button,
  Card,
  HStack,
  IconButton,
  MediaImage,
  Screen,
  Text,
  VStack,
} from '@/shared/ui';
import { isSignedUrlExpiredError, mapOrderApiError } from '../model/orders';

function parseArchiveRollId(raw: string | undefined): number | null {
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function ArchiveMetadataCard({ detail }: { readonly detail: FilmArchiveRollResponse }) {
  const stockTitle = detail.filmStockName ?? 'Dòng phim không còn trong danh mục';
  const formatTitle = detail.filmFormatName ?? 'Không xác định';

  return (
    <Card tone="brand">
      <VStack gap="xs">
        <HStack justify="between" align="center">
          <Badge label={`${detail.orderCode} · Cuộn #${detail.rollSequence}`} tone="brand" />
          <Badge label={`${detail.exposureCount} kiểu`} tone="neutral" />
        </HStack>
        <Text variant="title">{stockTitle}</Text>
        <Text variant="secondary" tone="secondary">
          {detail.labName} · Khổ {formatTitle}
        </Text>
        <Text variant="caption" tone="muted">
          Giao file lúc {formatDateTimeVn(detail.deliveredAt)}
        </Text>
        {detail.camera || detail.lens ? (
          <Text variant="caption" tone="secondary">
            Thiết bị: {[detail.camera, detail.lens].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
        {detail.shotOn || detail.location ? (
          <Text variant="caption" tone="secondary">
            Ghi chú chụp:{' '}
            {[detail.shotOn ? formatDateVn(detail.shotOn) : null, detail.location]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        ) : null}
        {detail.note ? <Text variant="caption">{detail.note}</Text> : null}
        {detail.frameCountDiscrepancyNote ? (
          <Alert
            testID={`orders.archive-detail.discrepancy.${detail.archiveRollId}`}
            tone="warning"
            message={`Ghi chú Lab: ${detail.frameCountDiscrepancyNote}`}
          />
        ) : null}
      </VStack>
    </Card>
  );
}

function ArchiveFullResolutionCard({ detail }: { readonly detail: FilmArchiveRollResponse }) {
  const link = detail.fullResolutionLink;

  return (
    <Card>
      <VStack gap="sm">
        <Text variant="heading">File gốc độ phân giải cao (Full-Resolution)</Text>
        {link ? (
          <>
            <Text variant="caption" tone="muted">
              {detail.linkVerifiedAt
                ? `Đã kiểm tra link lúc ${formatDateTimeVn(detail.linkVerifiedAt)}`
                : 'Link tải file gốc từ Phòng Lab'}
            </Text>
            <Button
              testID="orders.archive-detail.open-full-res"
              label="Mở liên kết tải Full-Res"
              variant="primary"
              onPress={() => {
                void openURL(link).catch(() => undefined);
              }}
            />
          </>
        ) : (
          <Text variant="caption" tone="muted">
            Chưa có liên kết file Full-Resolution cho cuộn phim này.
          </Text>
        )}
      </VStack>
    </Card>
  );
}

export function ArchiveRollDetailScreen() {
  const params = useLocalSearchParams<{ archiveRollId?: RawRouteParam }>();
  const archiveRollId = parseArchiveRollId(firstRouteParam(params.archiveRollId));

  const detailQuery = useQuery({
    queryKey: filmLinkQueryKeys.archive.roll(archiveRollId ?? 0),
    queryFn: () => filmLinkApi.fetchArchiveRollDetail(archiveRollId ?? 0),
    enabled: archiveRollId !== null,
    staleTime: SIGNED_URL_STALE_TIME_MS,
  });

  const sortedPreviews = [...(detailQuery.data?.previews ?? [])].sort(
    (a, b) => a.frameNumber - b.frameNumber,
  );

  return (
    <Screen testID="orders.archive-detail.screen" scroll edges="top">
      <VStack gap="md">
        <HStack align="center" justify="between" className="pt-2">
          <HStack gap="sm" align="center" className="flex-1">
            <IconButton
              testID="orders.archive-detail.back"
              icon="chevron-back"
              accessibilityLabel="Quay lại"
              onPress={() => router.back()}
            />
            <VStack gap="none" className="flex-1">
              <Text variant="title">Lưu trữ số cuộn phim</Text>
              <Text variant="caption" tone="muted">
                Ảnh xem trước JPEG & Liên kết tải gốc
              </Text>
            </VStack>
          </HStack>
          {archiveRollId !== null ? (
            <Button
              testID="orders.archive-detail.refresh"
              label="Làm mới"
              size="sm"
              variant="ghost"
              onPress={() => void detailQuery.refetch()}
            />
          ) : null}
        </HStack>

        {archiveRollId === null ? (
          <Alert
            testID="orders.archive-detail.error"
            tone="danger"
            message="Mã cuộn phim lưu trữ không hợp lệ."
          />
        ) : null}

        {detailQuery.isLoading ? (
          <Card testID="orders.archive-detail.loading" tone="muted">
            <Text variant="secondary" tone="muted">
              Đang tải thông tin và ảnh xem trước...
            </Text>
          </Card>
        ) : null}

        {detailQuery.isError ? (
          <VStack gap="sm">
            <Alert
              testID="orders.archive-detail.error"
              tone="danger"
              message={mapOrderApiError(detailQuery.error)}
            />
            <Button
              testID="orders.archive-detail.retry"
              label={
                isSignedUrlExpiredError(detailQuery.error) ? 'Làm mới liên kết ảnh' : 'Thử lại'
              }
              variant="outline"
              size="sm"
              onPress={() => void detailQuery.refetch()}
            />
          </VStack>
        ) : null}

        {detailQuery.data ? (
          <VStack gap="md">
            <ArchiveMetadataCard detail={detailQuery.data} />
            <ArchiveFullResolutionCard detail={detailQuery.data} />
            <Text variant="heading">Khung ảnh xem trước ({sortedPreviews.length})</Text>
            {sortedPreviews.length === 0 ? (
              <Card tone="muted">
                <Text variant="secondary" tone="muted">
                  Chưa có khung ảnh xem trước nào được tải lên.
                </Text>
              </Card>
            ) : (
              sortedPreviews.map((frame) => (
                <Card key={frame.id} tone="muted">
                  <VStack gap="xs">
                    <HStack justify="between" align="center">
                      <Badge label={`Khung #${frame.frameNumber}`} tone="neutral" />
                      <Text variant="caption" tone="muted">
                        {frame.widthPx} × {frame.heightPx} px
                      </Text>
                    </HStack>
                    <MediaImage
                      uri={frame.url}
                      accessibilityLabel={`Khung ảnh ${frame.frameNumber}`}
                    />
                    <Button
                      testID={`orders.archive-detail.preview-ai.${frame.id}`}
                      label="Xem thử dương bản AI"
                      size="sm"
                      variant="secondary"
                      onPress={() =>
                        router.push({
                          pathname: '/(modals)/negative-preview',
                          params: { scanFileId: String(frame.id) },
                        } as Href)
                      }
                    />
                  </VStack>
                </Card>
              ))
            )}
          </VStack>
        ) : null}
      </VStack>
    </Screen>
  );
}
