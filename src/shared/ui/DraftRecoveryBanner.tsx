import { formatDateTimeVn } from '@/shared/lib';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { HStack, VStack } from './Stack';
import { Text } from './Text';

export type DraftRecoveryBannerProps = {
  readonly testID: string;
  readonly visible: boolean;
  readonly pendingRetry?: boolean;
  readonly lastErrorDetail?: string | null;
  readonly lastSavedAt?: string | null;
  readonly title?: string;
  readonly description?: string;
  readonly restoreLabel?: string;
  readonly discardLabel?: string;
  readonly onRestore: () => void;
  readonly onDiscard: () => void;
};

const DEFAULT_SAVED_TITLE = 'Tìm thấy dữ liệu đã lưu tạm';
const DEFAULT_RETRY_TITLE = 'Yêu cầu trước đó chưa hoàn tất';
const DEFAULT_SAVED_DESC = 'Bạn có thể khôi phục thao tác chưa hoàn tất hoặc xóa để bắt đầu mới.';
const DEFAULT_RETRY_DESC =
  'Dữ liệu và khóa chống trùng lặp đã được giữ lại để bạn thử gửi lại an toàn.';

export function DraftRecoveryBanner({
  testID,
  visible,
  pendingRetry = false,
  lastErrorDetail,
  lastSavedAt,
  title,
  description,
  restoreLabel,
  discardLabel = 'Xóa bản nháp',
  onRestore,
  onDiscard,
}: DraftRecoveryBannerProps) {
  if (!visible) {
    return null;
  }

  const badgeLabel = pendingRetry ? 'Mất kết nối — Đã lưu tạm' : 'Bản nháp đã lưu';
  const resolvedTitle = title ?? (pendingRetry ? DEFAULT_RETRY_TITLE : DEFAULT_SAVED_TITLE);
  const resolvedDescription =
    description ?? (pendingRetry ? DEFAULT_RETRY_DESC : DEFAULT_SAVED_DESC);
  const resolvedRestoreLabel =
    restoreLabel ?? (pendingRetry ? 'Khôi phục & thử lại' : 'Khôi phục bản nháp');
  const formattedSavedAt = formatDateTimeVn(lastSavedAt);

  return (
    <Card testID={testID} tone={pendingRetry ? 'warning' : 'brand'}>
      <VStack gap="sm">
        <HStack justify="between" align="center" gap="sm">
          <Badge
            testID={`${testID}.badge`}
            label={badgeLabel}
            tone={pendingRetry ? 'warning' : 'brand'}
          />
          {formattedSavedAt ? (
            <Text testID={`${testID}.saved-at`} variant="caption" tone="muted">
              {`Lưu lúc ${formattedSavedAt}`}
            </Text>
          ) : null}
        </HStack>
        <Text testID={`${testID}.title`} variant="heading" accessibilityRole="header">
          {resolvedTitle}
        </Text>
        <Text testID={`${testID}.description`} variant="secondary" tone="secondary">
          {resolvedDescription}
        </Text>
        {lastErrorDetail ? (
          <Text testID={`${testID}.error`} variant="caption" tone="danger">
            {lastErrorDetail}
          </Text>
        ) : null}
        <HStack gap="sm">
          <Button
            testID={`${testID}.restore`}
            label={resolvedRestoreLabel}
            variant="primary"
            size="sm"
            className="flex-1"
            onPress={onRestore}
          />
          <Button
            testID={`${testID}.discard`}
            label={discardLabel}
            variant="outline"
            size="sm"
            onPress={onDiscard}
          />
        </HStack>
      </VStack>
    </Card>
  );
}
