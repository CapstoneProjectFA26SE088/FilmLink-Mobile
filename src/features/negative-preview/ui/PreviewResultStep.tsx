import type { NegativePreviewSessionResponse, SuggestedIntentChip } from '@/shared/api';
import { formatVnd } from '@/shared/lib';
import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  HStack,
  Icon,
  Input,
  MediaImage,
  SegmentedControl,
  Text,
  VStack,
} from '@/shared/ui';
import {
  canRegeneratePreview,
  DOWNLOAD_UNLOCK_LABELS,
  INTENT_PROMPT_MAX_LENGTH,
  isDownloadUnlocked,
  type NegativeCompareMode,
  remainingRegenerations,
} from '../model/negative-preview';

export type PreviewResultStepProps = {
  readonly session: NegativePreviewSessionResponse;
  readonly localFileUri: string | null;
  readonly compareMode: NegativeCompareMode;
  readonly onChangeCompareMode: (mode: NegativeCompareMode) => void;
  readonly followUpPrompt: string;
  readonly onChangeFollowUpPrompt: (text: string) => void;
  readonly onSelectFollowUpChip: (chip: SuggestedIntentChip) => void;
  readonly onRegenerate: () => void;
  readonly isRegenerating: boolean;
  readonly onRefreshSession: () => void;
  readonly isRefreshing: boolean;
  readonly onNewSession: () => void;
  readonly onUnlockDownload: () => void;
  readonly isUnlocking: boolean;
  readonly onCheckUnlock: () => void;
  readonly onDownloadHighRes: () => void;
  readonly isDownloading: boolean;
  readonly onOpenPrint: () => void;
};

function DownloadActionPanel({
  session,
  isUnlocking,
  isRefreshing,
  isDownloading,
  onUnlockDownload,
  onCheckUnlock,
  onDownloadHighRes,
}: {
  readonly session: NegativePreviewSessionResponse;
  readonly isUnlocking: boolean;
  readonly isRefreshing: boolean;
  readonly isDownloading: boolean;
  readonly onUnlockDownload: () => void;
  readonly onCheckUnlock: () => void;
  readonly onDownloadHighRes: () => void;
}) {
  const unlocked = isDownloadUnlocked(session);
  const freeQuota = session.remainingDailyFreeQuota ?? 0;
  const unlockLabel =
    freeQuota > 0
      ? `Mở khóa miễn phí (còn ${freeQuota} lượt)`
      : `Mở khóa tải ảnh gốc (${formatVnd(session.unlockFeeVnd)})`;

  return (
    <Card tone={unlocked ? 'success' : 'default'}>
      <VStack gap="sm">
        <HStack justify="between" align="center">
          <Text variant="heading">Tải ảnh dương bản độ phân giải cao</Text>
          <Badge
            label={unlocked ? 'Đã mở khóa' : 'Có watermark'}
            tone={unlocked ? 'success' : 'warning'}
          />
        </HStack>

        {!unlocked ? (
          <VStack gap="xs">
            <Text variant="caption" tone="secondary">
              Bản xem thử hiện tại có watermark. Mở khóa bằng lượt miễn phí hàng ngày hoặc VNPay để
              lưu ảnh gốc sạch.
            </Text>
            <Button
              testID="neg-preview.unlock-download"
              label={isUnlocking ? 'Đang xử lý mở khóa...' : unlockLabel}
              variant="primary"
              icon={<Icon name="lock-open-outline" size="sm" tone="inverse" />}
              loading={isUnlocking}
              disabled={isUnlocking}
              onPress={onUnlockDownload}
            />
            <Button
              testID="neg-preview.check-unlock"
              label={isRefreshing ? 'Đang kiểm tra...' : 'Kiểm tra trạng thái mở khóa'}
              variant="outline"
              size="sm"
              loading={isRefreshing}
              disabled={isRefreshing}
              onPress={onCheckUnlock}
            />
          </VStack>
        ) : (
          <Button
            testID="neg-preview.download-file"
            label={isDownloading ? 'Đang tải & lưu ảnh...' : 'Lưu ảnh độ phân giải cao'}
            variant="primary"
            icon={<Icon name="download-outline" size="sm" tone="inverse" />}
            loading={isDownloading}
            disabled={isDownloading}
            onPress={onDownloadHighRes}
          />
        )}
      </VStack>
    </Card>
  );
}

export function PreviewResultStep({
  session,
  localFileUri,
  compareMode,
  onChangeCompareMode,
  followUpPrompt,
  onChangeFollowUpPrompt,
  onSelectFollowUpChip,
  onRegenerate,
  isRegenerating,
  onRefreshSession,
  isRefreshing,
  onNewSession,
  onUnlockDownload,
  isUnlocking,
  onCheckUnlock,
  onDownloadHighRes,
  isDownloading,
  onOpenPrint,
}: PreviewResultStepProps) {
  const unlocked = isDownloadUnlocked(session);
  const canRegenerate = canRegeneratePreview(session);
  const turnsLeft = remainingRegenerations(session);
  const negativeUri = session.sourceSignedUrl ?? session.baseInvertedSignedUrl ?? localFileUri;
  const displayedUri = compareMode === 'positive' ? session.previewWatermarkedUrl : negativeUri;

  return (
    <VStack gap="md">
      <Card tone="elevated">
        <VStack gap="sm">
          <HStack justify="between" align="center">
            <Badge
              label={DOWNLOAD_UNLOCK_LABELS[session.downloadUnlockType]}
              tone={unlocked ? 'success' : 'brand'}
            />
            <Badge
              label={`${session.regenerationCount}/${session.maxRegenerations} lượt`}
              tone={canRegenerate ? 'neutral' : 'warning'}
            />
          </HStack>

          <VStack testID="neg-preview.compare-toggle" gap="xs">
            <SegmentedControl<NegativeCompareMode>
              testIDPrefix="neg-preview.compare"
              options={[
                { value: 'positive', label: 'Dương bản AI' },
                { value: 'negative', label: 'Âm bản gốc' },
              ]}
              value={compareMode}
              onChange={onChangeCompareMode}
            />
          </VStack>

          {displayedUri ? (
            <MediaImage
              uri={displayedUri}
              accessibilityLabel={
                compareMode === 'positive' ? 'Bản xem thử dương bản AI' : 'Ảnh âm bản gốc'
              }
              resizeMode="contain"
              className="h-64 w-full rounded-lg"
            />
          ) : (
            <Card tone="muted">
              <Text variant="caption" tone="muted">
                Liên kết ảnh chưa sẵn sàng. Nhấn làm mới để tải lại ảnh từ máy chủ.
              </Text>
            </Card>
          )}

          {session.isFallback ? (
            <Alert
              testID="neg-preview.fallback-notice"
              tone="warning"
              message="AI đang quá tải, hệ thống tạm dùng bộ chuyển đổi màu tham số dự phòng (UH-08). Bạn vẫn có thể tinh chỉnh hoặc thử lại."
            />
          ) : null}

          <HStack gap="xs">
            <Button
              testID="neg-preview.refresh-session"
              label={isRefreshing ? 'Đang làm mới...' : 'Làm mới liên kết ảnh'}
              variant="outline"
              size="sm"
              className="flex-1"
              loading={isRefreshing}
              disabled={isRefreshing}
              onPress={onRefreshSession}
            />
            <Button
              testID="neg-preview.new-session"
              label="Phiên mới"
              variant="ghost"
              size="sm"
              onPress={onNewSession}
            />
          </HStack>
        </VStack>
      </Card>

      <Card>
        <VStack gap="sm">
          <HStack justify="between" align="center">
            <Text variant="heading">Tinh chỉnh bằng mô tả</Text>
            <Text variant="caption" tone="muted">
              Còn {turnsLeft} lượt
            </Text>
          </HStack>

          {session.suggestedIntents.length > 0 ? (
            <HStack gap="xs" className="flex-wrap">
              {session.suggestedIntents.map((chip) => (
                <Button
                  key={chip.code}
                  testID={`neg-preview.followup-chip.${chip.code}`}
                  label={chip.labelVn}
                  size="sm"
                  variant="outline"
                  disabled={!canRegenerate || isRegenerating}
                  onPress={() => onSelectFollowUpChip(chip)}
                />
              ))}
            </HStack>
          ) : null}

          <Input
            testID="neg-preview.followup-input"
            label="Yêu cầu điều chỉnh tiếp theo"
            multiline
            value={followUpPrompt}
            onChangeText={(text) => onChangeFollowUpPrompt(text.slice(0, INTENT_PROMPT_MAX_LENGTH))}
            placeholder="Ví dụ: Ấm hơn nhẹ, giữ chi tiết vùng tối"
            helperText={
              canRegenerate
                ? `${followUpPrompt.trim().length}/${INTENT_PROMPT_MAX_LENGTH} ký tự · Không dùng thanh chỉnh thủ công`
                : 'Đã đạt giới hạn 3 lượt tinh chỉnh cho phiên này. Hãy tải ảnh, đặt in hoặc tạo phiên mới.'
            }
          />

          <Button
            testID="neg-preview.followup-generate"
            label={isRegenerating ? 'Đang tinh chỉnh...' : 'Tinh chỉnh dương bản'}
            variant="secondary"
            icon={<Icon name="color-wand-outline" size="sm" tone="default" />}
            loading={isRegenerating}
            disabled={!canRegenerate || isRegenerating}
            onPress={onRegenerate}
          />
        </VStack>
      </Card>

      <Divider label="Tiếp theo" />

      <DownloadActionPanel
        session={session}
        isUnlocking={isUnlocking}
        isRefreshing={isRefreshing}
        isDownloading={isDownloading}
        onUnlockDownload={onUnlockDownload}
        onCheckUnlock={onCheckUnlock}
        onDownloadHighRes={onDownloadHighRes}
      />

      <Card tone="brand">
        <VStack gap="sm">
          <Text variant="heading">Đặt in ảnh tại Phòng Lab đối tác</Text>
          <Text variant="caption" tone="secondary">
            Chọn Phòng Lab, khổ giấy ảnh (3R – A4), số lượng (1 – 500) và nhận báo giá trực tiếp từ
            bản dương bản này.
          </Text>
          <Button
            testID="neg-preview.open-print"
            label="Đặt in ảnh tại Phòng Lab"
            variant="secondary"
            icon={<Icon name="print-outline" size="sm" tone="default" />}
            onPress={onOpenPrint}
          />
        </VStack>
      </Card>
    </VStack>
  );
}
