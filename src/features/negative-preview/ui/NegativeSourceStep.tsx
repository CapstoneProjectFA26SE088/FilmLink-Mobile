import { useState } from 'react';
import { Platform } from 'react-native';
import type {
  FilmArchiveRollResponse,
  FilmArchiveRollSummaryResponse,
  NegativePreviewSessionSummaryResponse,
} from '@/shared/api';
import type { NegativePreviewDraft } from '@/shared/domain';
import { formatDateTimeVn } from '@/shared/lib';
import { Badge, Button, Card, HStack, Icon, MediaImage, Text, VStack } from '@/shared/ui';
import { DETECTED_BASE_TYPE_LABELS, PREVIEW_STATUS_LABELS } from '../model/negative-preview';

export type NegativeSourceStepProps = {
  readonly draft: NegativePreviewDraft;
  readonly activeScanFileId: number | null;
  readonly pickedBlobPresent: boolean;
  readonly isSubmitting: boolean;
  readonly onPickCamera: () => void;
  readonly onPickLibrary: () => void;
  readonly onSelectScanFile: (scanFileId: number) => void;
  readonly onClearSource: () => void;
  readonly onAnalyze: () => void;
  readonly onSelectHistorySession: (sessionId: number) => void;
  readonly sessions: readonly NegativePreviewSessionSummaryResponse[];
  readonly sessionsLoading: boolean;
  readonly sessionsError: string | null;
  readonly onToggleHistory: (open: boolean) => void;
  readonly archiveRolls: readonly FilmArchiveRollSummaryResponse[];
  readonly archiveLoading: boolean;
  readonly archiveError: string | null;
  readonly selectedArchiveRollId: number | null;
  readonly onSelectArchiveRoll: (archiveRollId: number) => void;
  readonly archiveRollDetail: FilmArchiveRollResponse | undefined;
  readonly archiveDetailLoading: boolean;
  readonly onToggleArchive: (open: boolean) => void;
};

function SelectedSourceCard({
  draft,
  activeScanFileId,
  pickedBlobPresent,
  isSubmitting,
  onClearSource,
  onAnalyze,
}: {
  readonly draft: NegativePreviewDraft;
  readonly activeScanFileId: number | null;
  readonly pickedBlobPresent: boolean;
  readonly isSubmitting: boolean;
  readonly onClearSource: () => void;
  readonly onAnalyze: () => void;
}) {
  const hasUploadedFile = draft.sourceType === 'UPLOADED_NEGATIVE' && draft.localFileUri !== null;
  const hasArchiveFile = activeScanFileId !== null;
  if (!hasUploadedFile && !hasArchiveFile) {
    return null;
  }

  const sizeKb =
    draft.localFileSizeBytes !== null
      ? `${Math.max(1, Math.round(draft.localFileSizeBytes / 1024))} KB`
      : null;
  const isWebMissingBlob = hasUploadedFile && Platform.OS === 'web' && !pickedBlobPresent;

  return (
    <Card tone="elevated">
      <VStack gap="sm">
        <HStack justify="between" align="center">
          <Badge
            label={hasArchiveFile ? `Lưu trữ số · Khung #${activeScanFileId}` : 'Âm bản vừa chọn'}
            tone="brand"
          />
          <Button
            testID="neg-preview.clear-source"
            label="Xóa chọn"
            size="sm"
            variant="ghost"
            disabled={isSubmitting}
            onPress={onClearSource}
          />
        </HStack>

        {hasUploadedFile && draft.localFileUri ? (
          <VStack gap="xs">
            <MediaImage
              uri={draft.localFileUri}
              accessibilityLabel="Ảnh âm bản đã chọn"
              resizeMode="contain"
              className="h-56 w-full rounded-lg"
            />
            <Text variant="caption" tone="secondary">
              {[draft.localFileName, sizeKb].filter(Boolean).join(' · ') ||
                'Tệp ảnh âm bản đã sẵn sàng'}
            </Text>
          </VStack>
        ) : (
          <Text variant="secondary" tone="secondary">
            Sẵn sàng phân tích khung ảnh #{activeScanFileId} từ Lưu trữ số FilmLink.
          </Text>
        )}

        {isWebMissingBlob ? (
          <Card tone="warning">
            <Text variant="caption" tone="warning">
              Trình duyệt đã tải lại và không còn giữ dữ liệu tệp tạm. Vui lòng chọn lại ảnh âm bản
              từ máy trước khi phân tích.
            </Text>
          </Card>
        ) : null}

        <Button
          testID="neg-preview.upload"
          label={isSubmitting ? 'Đang phân tích âm bản...' : 'Phân tích âm bản'}
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting}
          onPress={onAnalyze}
        />
      </VStack>
    </Card>
  );
}

function ArchivePickerCard({
  archiveRolls,
  archiveLoading,
  archiveError,
  selectedArchiveRollId,
  onSelectArchiveRoll,
  archiveRollDetail,
  archiveDetailLoading,
  onSelectScanFile,
}: {
  readonly archiveRolls: readonly FilmArchiveRollSummaryResponse[];
  readonly archiveLoading: boolean;
  readonly archiveError: string | null;
  readonly selectedArchiveRollId: number | null;
  readonly onSelectArchiveRoll: (archiveRollId: number) => void;
  readonly archiveRollDetail: FilmArchiveRollResponse | undefined;
  readonly archiveDetailLoading: boolean;
  readonly onSelectScanFile: (scanFileId: number) => void;
}) {
  const frames = [...(archiveRollDetail?.previews ?? [])].sort(
    (a, b) => a.frameNumber - b.frameNumber,
  );

  return (
    <Card tone="muted">
      <VStack gap="sm">
        <Text variant="heading">Chọn khung từ Lưu trữ số</Text>
        {archiveLoading ? (
          <Text variant="caption" tone="muted">
            Đang tải danh sách cuộn phim đã lưu trữ...
          </Text>
        ) : null}
        {archiveError ? (
          <Text variant="caption" tone="danger">
            {archiveError}
          </Text>
        ) : null}
        {!archiveLoading && !archiveError && archiveRolls.length === 0 ? (
          <Text variant="caption" tone="muted">
            Bạn chưa có cuộn phim nào trong Lưu trữ số.
          </Text>
        ) : null}
        {archiveRolls.map((roll) => (
          <Card
            key={roll.archiveRollId}
            testID={`neg-preview.archive-roll.${roll.archiveRollId}`}
            tone={selectedArchiveRollId === roll.archiveRollId ? 'brand' : 'default'}
            onPress={() => onSelectArchiveRoll(roll.archiveRollId)}
          >
            <VStack gap="xs">
              <HStack justify="between" align="center">
                <Text variant="secondary">
                  {roll.orderCode} · Cuộn #{roll.rollSequence}
                </Text>
                <Badge label={`${roll.previewCount} khung`} tone="neutral" />
              </HStack>
              <Text variant="caption" tone="muted">
                {roll.labName} · {roll.filmStockName ?? 'Phim cuộn'}
              </Text>
            </VStack>
          </Card>
        ))}

        {selectedArchiveRollId !== null && archiveDetailLoading ? (
          <Text variant="caption" tone="muted">
            Đang tải các khung ảnh trong cuộn #{selectedArchiveRollId}...
          </Text>
        ) : null}

        {frames.length > 0 ? (
          <VStack gap="xs">
            <Text variant="caption" tone="secondary">
              Chọn một khung ảnh để xem thử dương bản AI:
            </Text>
            {frames.map((frame) => (
              <Card key={frame.id} tone="default">
                <VStack gap="xs">
                  <HStack justify="between" align="center">
                    <Badge label={`Khung #${frame.frameNumber}`} tone="neutral" />
                    <Text variant="caption" tone="muted">
                      {frame.widthPx} × {frame.heightPx} px
                    </Text>
                  </HStack>
                  <MediaImage
                    uri={frame.url}
                    accessibilityLabel={`Khung lưu trữ ${frame.frameNumber}`}
                    resizeMode="contain"
                    className="h-40 w-full rounded"
                  />
                  <Button
                    testID={`neg-preview.archive-frame.${frame.id}`}
                    label={`Chọn Khung #${frame.frameNumber}`}
                    size="sm"
                    variant="secondary"
                    onPress={() => onSelectScanFile(frame.id)}
                  />
                </VStack>
              </Card>
            ))}
          </VStack>
        ) : null}
      </VStack>
    </Card>
  );
}

function SessionHistoryCard({
  sessions,
  sessionsLoading,
  sessionsError,
  onSelectHistorySession,
}: {
  readonly sessions: readonly NegativePreviewSessionSummaryResponse[];
  readonly sessionsLoading: boolean;
  readonly sessionsError: string | null;
  readonly onSelectHistorySession: (sessionId: number) => void;
}) {
  return (
    <Card tone="muted">
      <VStack gap="sm">
        <Text variant="heading">Phiên xem thử gần đây</Text>
        {sessionsLoading ? (
          <Text variant="caption" tone="muted">
            Đang tải lịch sử phiên xem thử...
          </Text>
        ) : null}
        {sessionsError ? (
          <Text variant="caption" tone="danger">
            {sessionsError}
          </Text>
        ) : null}
        {!sessionsLoading && !sessionsError && sessions.length === 0 ? (
          <Text variant="caption" tone="muted">
            Chưa có phiên xem thử dương bản nào trước đây.
          </Text>
        ) : null}
        {sessions.map((item) => (
          <Card
            key={item.id}
            testID={`neg-preview.history.${item.id}`}
            tone="default"
            onPress={() => onSelectHistorySession(item.id)}
          >
            <VStack gap="xs">
              <HStack justify="between" align="center">
                <Text variant="secondary">{item.sessionCode}</Text>
                <Badge
                  label={PREVIEW_STATUS_LABELS[item.status]}
                  tone={item.status === 'READY' ? 'success' : 'neutral'}
                />
              </HStack>
              <Text variant="caption" tone="muted">
                {DETECTED_BASE_TYPE_LABELS[item.detectedBaseType]} ·{' '}
                {formatDateTimeVn(item.createdAt)}
              </Text>
            </VStack>
          </Card>
        ))}
      </VStack>
    </Card>
  );
}

export function NegativeSourceStep({
  draft,
  activeScanFileId,
  pickedBlobPresent,
  isSubmitting,
  onPickCamera,
  onPickLibrary,
  onSelectScanFile,
  onClearSource,
  onAnalyze,
  onSelectHistorySession,
  sessions,
  sessionsLoading,
  sessionsError,
  onToggleHistory,
  archiveRolls,
  archiveLoading,
  archiveError,
  selectedArchiveRollId,
  onSelectArchiveRoll,
  archiveRollDetail,
  archiveDetailLoading,
  onToggleArchive,
}: NegativeSourceStepProps) {
  const [showArchive, setShowArchive] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleToggleArchive = () => {
    const next = !showArchive;
    setShowArchive(next);
    onToggleArchive(next);
  };

  const handleToggleHistory = () => {
    const next = !showHistory;
    setShowHistory(next);
    onToggleHistory(next);
  };

  return (
    <VStack gap="md">
      <Card tone="brand">
        <VStack gap="sm">
          <Badge label="Bước 1 · Chọn ảnh âm bản" tone="brand" />
          <Text variant="heading">Chụp hoặc chọn ảnh phim âm bản</Text>
          <Text variant="secondary" tone="secondary">
            Hỗ trợ JPEG/PNG tối đa 10 MB từ máy ảnh, thư viện ảnh hoặc Lưu trữ số của bạn.
          </Text>
          <VStack gap="xs">
            <Button
              testID="neg-preview.pick-camera"
              label="Chụp ảnh âm bản"
              variant="primary"
              icon={<Icon name="camera-outline" size="sm" tone="inverse" />}
              disabled={isSubmitting}
              onPress={onPickCamera}
            />
            <Button
              testID="neg-preview.pick-library"
              label="Chọn từ Thư viện ảnh"
              variant="secondary"
              icon={<Icon name="images-outline" size="sm" tone="default" />}
              disabled={isSubmitting}
              onPress={onPickLibrary}
            />
            <Button
              testID="neg-preview.pick-archive"
              label={showArchive ? 'Ẩn Lưu trữ số' : 'Chọn từ Lưu trữ số'}
              variant="outline"
              icon={<Icon name="albums-outline" size="sm" tone="brand" />}
              disabled={isSubmitting}
              onPress={handleToggleArchive}
            />
          </VStack>
        </VStack>
      </Card>

      <SelectedSourceCard
        draft={draft}
        activeScanFileId={activeScanFileId}
        pickedBlobPresent={pickedBlobPresent}
        isSubmitting={isSubmitting}
        onClearSource={onClearSource}
        onAnalyze={onAnalyze}
      />

      {showArchive ? (
        <ArchivePickerCard
          archiveRolls={archiveRolls}
          archiveLoading={archiveLoading}
          archiveError={archiveError}
          selectedArchiveRollId={selectedArchiveRollId}
          onSelectArchiveRoll={onSelectArchiveRoll}
          archiveRollDetail={archiveRollDetail}
          archiveDetailLoading={archiveDetailLoading}
          onSelectScanFile={(scanFileId) => {
            setShowArchive(false);
            onSelectScanFile(scanFileId);
          }}
        />
      ) : null}

      <Button
        testID="neg-preview.history-toggle"
        label={showHistory ? 'Ẩn phiên gần đây' : 'Phiên gần đây'}
        variant="ghost"
        size="sm"
        icon={<Icon name="time-outline" size="sm" tone="muted" />}
        onPress={handleToggleHistory}
      />

      {showHistory ? (
        <SessionHistoryCard
          sessions={sessions}
          sessionsLoading={sessionsLoading}
          sessionsError={sessionsError}
          onSelectHistorySession={onSelectHistorySession}
        />
      ) : null}
    </VStack>
  );
}
