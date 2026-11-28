import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { openURL } from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform } from 'react-native';
import {
  CATALOG_STALE_TIME_MS,
  type CreateNegativePreviewSessionData,
  filmLinkApi,
  filmLinkQueryKeys,
  type GenerateNegativePreviewRequest,
  type MultipartFile,
  type NegativePreviewSessionResponse,
  ORDER_STALE_TIME_MS,
  SIGNED_URL_STALE_TIME_MS,
  type SuggestedIntentChip,
  type UnlockNegativePreviewDownloadRequest,
} from '@/shared/api';
import { authStore, type NegativePreviewDraft, NegativePreviewDraftSchema } from '@/shared/domain';
import { useDraftPersistence } from '@/shared/hooks';
import {
  captureNegativeFromCamera,
  firstRouteParam,
  type MediaPickOutcome,
  pickNegativeFromLibrary,
  type RawRouteParam,
  removeDraftMediaFile,
  saveRemotePositiveToLibrary,
  useStore,
} from '@/shared/lib';
import {
  Alert,
  Button,
  Card,
  DraftRecoveryBanner,
  HStack,
  Screen,
  Text,
  VStack,
} from '@/shared/ui';
import {
  INITIAL_NEGATIVE_PREVIEW_DRAFT,
  isNegativePreviewDraftEmpty,
  mapNegativePreviewApiError,
  type NegativeCompareMode,
  resolveInitialStep,
  validateIntentPrompt,
} from '../model/negative-preview';
import { IntentPromptStep } from './IntentPromptStep';
import { NegativeSourceStep } from './NegativeSourceStep';
import { PreviewResultStep } from './PreviewResultStep';
import { PrintOrderSheetSection } from './PrintOrderSheetSection';

function parsePositiveParam(raw: RawRouteParam): number | null {
  const value = firstRouteParam(raw);
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function buildUploadRequestArgs(
  draft: NegativePreviewDraft,
  activeScanFileId: number | null,
  pickedBlob: Blob | undefined,
): {
  readonly error?: string;
  readonly payload?: {
    readonly data: CreateNegativePreviewSessionData;
    readonly file?: MultipartFile;
  };
} {
  if (activeScanFileId !== null) {
    return {
      payload: {
        data: { sourceType: 'ARCHIVE_SCAN_FILE', scanFileId: activeScanFileId },
      },
    };
  }
  if (!draft.localFileUri || !draft.localFileMimeType) {
    return { error: 'Vui lòng chọn hoặc chụp ảnh âm bản trước khi phân tích.' };
  }
  if (Platform.OS === 'web' && !pickedBlob) {
    return {
      error:
        'Trình duyệt không còn giữ dữ liệu ảnh tạm sau khi tải lại trang. Vui lòng chọn lại ảnh âm bản.',
    };
  }
  return {
    payload: {
      data: { sourceType: 'UPLOADED_NEGATIVE' },
      file: {
        field: 'file',
        uri: draft.localFileUri,
        name: draft.localFileName ?? 'negative.jpg',
        type: draft.localFileMimeType,
        ...(pickedBlob ? { blob: pickedBlob } : {}),
      },
    },
  };
}

function NegativePreviewAuthGate() {
  return (
    <VStack gap="sm">
      <Alert
        testID="neg-preview.auth-required"
        tone="info"
        message="Đăng nhập tài khoản FilmLink để chụp âm bản, xem thử dương bản AI và đặt in tại Phòng Lab."
      />
      <Button
        testID="neg-preview.login"
        label="Đăng nhập để tiếp tục"
        variant="primary"
        onPress={() => router.push('/(auth)/login')}
      />
    </VStack>
  );
}

function NegativePreviewHeader() {
  return (
    <HStack justify="between" align="center" className="pt-2">
      <VStack gap="none" className="flex-1">
        <Text variant="title">Xem thử Dương bản AI</Text>
        <Text variant="caption" tone="muted">
          Chuyển âm bản theo mô tả tự nhiên & đặt in Lab
        </Text>
      </VStack>
      <Button
        testID="neg-preview.close"
        label="Đóng"
        variant="ghost"
        size="sm"
        onPress={() => router.back()}
      />
    </HStack>
  );
}

function NegativePreviewStatusBanners({
  displayedError,
  noticeMessage,
  isLoadingSession,
  activeSessionId,
}: {
  readonly displayedError: string | null;
  readonly noticeMessage: string | null;
  readonly isLoadingSession: boolean;
  readonly activeSessionId: number | null;
}) {
  return (
    <>
      {displayedError ? (
        <Alert testID="neg-preview.error" tone="danger" message={displayedError} />
      ) : null}
      {noticeMessage ? (
        <Alert testID="neg-preview.notice" tone="info" message={noticeMessage} />
      ) : null}
      {activeSessionId !== null && isLoadingSession ? (
        <Card tone="muted">
          <Text variant="secondary" tone="muted">
            Đang tải phiên xem thử dương bản #{activeSessionId}...
          </Text>
        </Card>
      ) : null}
    </>
  );
}

function NegativePreviewStepBody({
  currentStep,
  currentSession,
  draft,
  activeScanFileId,
  pickedBlobPresent,
  compareMode,
  isCreatingSession,
  isGenerating,
  isRefreshing,
  isUnlocking,
  isDownloading,
  sessions,
  sessionsLoading,
  sessionsError,
  archiveRolls,
  archiveLoading,
  archiveError,
  selectedArchiveRollId,
  archiveRollDetail,
  archiveDetailLoading,
  onPickCamera,
  onPickLibrary,
  onSelectScanFile,
  onClearSource,
  onAnalyze,
  onSelectHistorySession,
  onToggleHistory,
  onSelectArchiveRoll,
  onToggleArchive,
  onChangePrompt,
  onSelectChip,
  onGenerate,
  onNewSession,
  onChangeCompareMode,
  onRefreshSession,
  onUnlockDownload,
  onCheckUnlock,
  onDownloadHighRes,
  onOpenPrint,
  onClosePrint,
}: {
  readonly currentStep: ReturnType<typeof resolveInitialStep>;
  readonly currentSession: NegativePreviewSessionResponse | undefined;
  readonly draft: NegativePreviewDraft;
  readonly activeScanFileId: number | null;
  readonly pickedBlobPresent: boolean;
  readonly compareMode: NegativeCompareMode;
  readonly isCreatingSession: boolean;
  readonly isGenerating: boolean;
  readonly isRefreshing: boolean;
  readonly isUnlocking: boolean;
  readonly isDownloading: boolean;
  readonly sessions: Parameters<typeof NegativeSourceStep>[0]['sessions'];
  readonly sessionsLoading: boolean;
  readonly sessionsError: string | null;
  readonly archiveRolls: Parameters<typeof NegativeSourceStep>[0]['archiveRolls'];
  readonly archiveLoading: boolean;
  readonly archiveError: string | null;
  readonly selectedArchiveRollId: number | null;
  readonly archiveRollDetail: Parameters<typeof NegativeSourceStep>[0]['archiveRollDetail'];
  readonly archiveDetailLoading: boolean;
  readonly onPickCamera: () => void;
  readonly onPickLibrary: () => void;
  readonly onSelectScanFile: (scanFileId: number) => void;
  readonly onClearSource: () => void;
  readonly onAnalyze: () => void;
  readonly onSelectHistorySession: (sessionId: number) => void;
  readonly onToggleHistory: (open: boolean) => void;
  readonly onSelectArchiveRoll: (rollId: number) => void;
  readonly onToggleArchive: (open: boolean) => void;
  readonly onChangePrompt: (prompt: string) => void;
  readonly onSelectChip: (chip: SuggestedIntentChip) => void;
  readonly onGenerate: () => void;
  readonly onNewSession: () => void;
  readonly onChangeCompareMode: (mode: NegativeCompareMode) => void;
  readonly onRefreshSession: () => void;
  readonly onUnlockDownload: () => void;
  readonly onCheckUnlock: () => void;
  readonly onDownloadHighRes: () => void;
  readonly onOpenPrint: () => void;
  readonly onClosePrint: () => void;
}) {
  if (currentStep === 'source') {
    return (
      <NegativeSourceStep
        draft={draft}
        activeScanFileId={activeScanFileId}
        pickedBlobPresent={pickedBlobPresent}
        isSubmitting={isCreatingSession}
        onPickCamera={onPickCamera}
        onPickLibrary={onPickLibrary}
        onSelectScanFile={onSelectScanFile}
        onClearSource={onClearSource}
        onAnalyze={onAnalyze}
        onSelectHistorySession={onSelectHistorySession}
        sessions={sessions}
        sessionsLoading={sessionsLoading}
        sessionsError={sessionsError}
        onToggleHistory={onToggleHistory}
        archiveRolls={archiveRolls}
        archiveLoading={archiveLoading}
        archiveError={archiveError}
        selectedArchiveRollId={selectedArchiveRollId}
        onSelectArchiveRoll={onSelectArchiveRoll}
        archiveRollDetail={archiveRollDetail}
        archiveDetailLoading={archiveDetailLoading}
        onToggleArchive={onToggleArchive}
      />
    );
  }
  if (!currentSession) {
    return null;
  }
  if (currentStep === 'intent') {
    return (
      <IntentPromptStep
        session={currentSession}
        localFileUri={draft.localFileUri}
        intentPrompt={draft.intentPrompt}
        selectedStyleCode={draft.selectedStyleCode}
        isGenerating={isGenerating}
        onChangePrompt={onChangePrompt}
        onSelectChip={onSelectChip}
        onGenerate={onGenerate}
        onNewSession={onNewSession}
      />
    );
  }
  if (currentStep === 'preview') {
    return (
      <PreviewResultStep
        session={currentSession}
        localFileUri={draft.localFileUri}
        compareMode={compareMode}
        onChangeCompareMode={onChangeCompareMode}
        followUpPrompt={draft.intentPrompt}
        onChangeFollowUpPrompt={onChangePrompt}
        onSelectFollowUpChip={onSelectChip}
        onRegenerate={onGenerate}
        isRegenerating={isGenerating}
        onRefreshSession={onRefreshSession}
        isRefreshing={isRefreshing}
        onNewSession={onNewSession}
        onUnlockDownload={onUnlockDownload}
        isUnlocking={isUnlocking}
        onCheckUnlock={onCheckUnlock}
        onDownloadHighRes={onDownloadHighRes}
        isDownloading={isDownloading}
        onOpenPrint={onOpenPrint}
      />
    );
  }
  return <PrintOrderSheetSection sessionId={currentSession.id} onClose={onClosePrint} />;
}

function NegativePreviewAuthenticatedBody() {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    scanFileId?: RawRouteParam;
    sessionId?: RawRouteParam;
  }>();
  const user = useStore(authStore, (state) => state.user);

  const [routeScanFileId, setRouteScanFileId] = useState<number | null>(() =>
    parsePositiveParam(params.scanFileId),
  );
  const [routeSessionId, setRouteSessionId] = useState<number | null>(() =>
    parsePositiveParam(params.sessionId),
  );
  const [pickedBlob, setPickedBlob] = useState<Blob | undefined>(undefined);
  const [compareMode, setCompareMode] = useState<NegativeCompareMode>('positive');
  const [printOpen, setPrintOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [selectedArchiveRollId, setSelectedArchiveRollId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const {
    draft,
    hasRecoverableDraft,
    pendingRetry,
    lastErrorDetail,
    lastSavedAt,
    updateDraft,
    restoreDraft,
    markSubmissionFailed,
    clearDraft,
  } = useDraftPersistence<NegativePreviewDraft>({
    flowKey: 'negative_preview',
    accountId: user?.id ?? null,
    schema: NegativePreviewDraftSchema,
    initialDraft: INITIAL_NEGATIVE_PREVIEW_DRAFT,
    isEmpty: isNegativePreviewDraftEmpty,
  });

  const activeSessionId = draft.sessionId ?? routeSessionId;
  const activeScanFileId = draft.scanFileId ?? routeScanFileId;

  const sessionQuery = useQuery({
    queryKey: filmLinkQueryKeys.negativePreview.session(activeSessionId ?? 0),
    queryFn: () => filmLinkApi.fetchNegativePreviewSession(activeSessionId ?? 0),
    enabled: activeSessionId !== null,
    staleTime: SIGNED_URL_STALE_TIME_MS,
  });

  const sessionsListQuery = useQuery({
    queryKey: filmLinkQueryKeys.negativePreview.sessions({ page: 0, size: 10 }),
    queryFn: () => filmLinkApi.fetchNegativePreviewSessions({ page: 0, size: 10 }),
    enabled: historyOpen,
    staleTime: ORDER_STALE_TIME_MS,
  });

  const archiveListQuery = useQuery({
    queryKey: filmLinkQueryKeys.archive.list({ page: 0, size: 10 }),
    queryFn: () => filmLinkApi.fetchFilmArchive({ page: 0, size: 10 }),
    enabled: archiveOpen,
    staleTime: CATALOG_STALE_TIME_MS,
  });

  const archiveDetailQuery = useQuery({
    queryKey: filmLinkQueryKeys.archive.roll(selectedArchiveRollId ?? 0),
    queryFn: () => filmLinkApi.fetchArchiveRollDetail(selectedArchiveRollId ?? 0),
    enabled: archiveOpen && selectedArchiveRollId !== null,
    staleTime: SIGNED_URL_STALE_TIME_MS,
  });

  const createSessionMutation = useMutation({
    mutationFn: ({
      data,
      file,
    }: {
      readonly data: CreateNegativePreviewSessionData;
      readonly file?: MultipartFile;
    }) => filmLinkApi.createNegativePreviewSession(data, file),
  });

  const generateMutation = useMutation({
    mutationFn: ({
      sessionId,
      payload,
    }: {
      readonly sessionId: number;
      readonly payload: GenerateNegativePreviewRequest;
    }) => filmLinkApi.generateNegativePreview(sessionId, payload),
  });

  const unlockMutation = useMutation({
    mutationFn: ({
      sessionId,
      payload,
    }: {
      readonly sessionId: number;
      readonly payload: UnlockNegativePreviewDownloadRequest;
    }) => filmLinkApi.unlockNegativePreviewDownload(sessionId, payload),
  });

  const downloadMutation = useMutation({
    mutationFn: (sessionId: number) => filmLinkApi.fetchNegativePreviewDownload(sessionId),
  });

  const currentSession: NegativePreviewSessionResponse | undefined = sessionQuery.data;
  const currentStep = resolveInitialStep(currentSession, printOpen);

  const applyPickOutcome = (outcome: MediaPickOutcome) => {
    if (outcome.kind === 'cancelled') {
      return;
    }
    if (outcome.kind === 'denied' || outcome.kind === 'invalid') {
      setActionError(outcome.message);
      return;
    }
    setActionError(null);
    setNoticeMessage(null);
    setRouteScanFileId(null);
    setRouteSessionId(null);
    setPickedBlob(outcome.asset.blob);
    removeDraftMediaFile(draft.localFileUri);
    updateDraft((prev) => ({
      ...prev,
      sessionId: null,
      sourceType: 'UPLOADED_NEGATIVE',
      scanFileId: null,
      localFileUri: outcome.asset.uri,
      localFileName: outcome.asset.name,
      localFileMimeType: outcome.asset.mimeType,
      localFileSizeBytes: outcome.asset.sizeBytes,
    }));
  };

  const handleSelectScanFile = (scanFileId: number) => {
    setActionError(null);
    setNoticeMessage(null);
    setRouteScanFileId(null);
    setRouteSessionId(null);
    setPickedBlob(undefined);
    removeDraftMediaFile(draft.localFileUri);
    updateDraft((prev) => ({
      ...prev,
      sessionId: null,
      sourceType: 'ARCHIVE_SCAN_FILE',
      scanFileId,
      localFileUri: null,
      localFileName: null,
      localFileMimeType: null,
      localFileSizeBytes: null,
    }));
  };

  const handleClearSource = () => {
    setActionError(null);
    setNoticeMessage(null);
    setRouteScanFileId(null);
    setRouteSessionId(null);
    setPickedBlob(undefined);
    removeDraftMediaFile(draft.localFileUri);
    updateDraft((prev) => ({
      ...prev,
      sessionId: null,
      sourceType: 'UPLOADED_NEGATIVE',
      scanFileId: null,
      localFileUri: null,
      localFileName: null,
      localFileMimeType: null,
      localFileSizeBytes: null,
    }));
  };

  const handleAnalyzeSource = async () => {
    setActionError(null);
    setNoticeMessage(null);
    const requestArgs = buildUploadRequestArgs(draft, activeScanFileId, pickedBlob);
    if (!requestArgs.payload) {
      setActionError(requestArgs.error ?? 'Không thể chuẩn bị ảnh âm bản.');
      return;
    }
    try {
      const created = await createSessionMutation.mutateAsync(requestArgs.payload);
      queryClient.setQueryData(filmLinkQueryKeys.negativePreview.session(created.id), created);
      updateDraft((prev) => ({ ...prev, sessionId: created.id }));
    } catch (err) {
      setActionError(mapNegativePreviewApiError(err));
      await markSubmissionFailed(err);
    }
  };

  const handleSelectChip = (chip: SuggestedIntentChip) => {
    setActionError(null);
    updateDraft((prev) => ({
      ...prev,
      intentPrompt: chip.promptText,
      selectedStyleCode: chip.code,
    }));
  };

  const handleGenerate = async () => {
    if (!currentSession) {
      return;
    }
    const validation = validateIntentPrompt(draft.intentPrompt);
    if (validation) {
      setActionError(validation);
      return;
    }
    setActionError(null);
    setNoticeMessage(null);
    try {
      const updated = await generateMutation.mutateAsync({
        sessionId: currentSession.id,
        payload: {
          intentPrompt: draft.intentPrompt.trim(),
          ...(draft.selectedStyleCode ? { styleCode: draft.selectedStyleCode } : {}),
        },
      });
      queryClient.setQueryData(filmLinkQueryKeys.negativePreview.session(updated.id), updated);
      setCompareMode('positive');
      updateDraft((prev) => ({ ...prev, intentPrompt: '', selectedStyleCode: null }));
    } catch (err) {
      setActionError(mapNegativePreviewApiError(err));
      await markSubmissionFailed(err);
    }
  };

  const handleUnlockDownload = async () => {
    if (!currentSession) {
      return;
    }
    setActionError(null);
    setNoticeMessage(null);
    const useFreeQuota = (currentSession.remainingDailyFreeQuota ?? 0) > 0;
    try {
      const result = await unlockMutation.mutateAsync({
        sessionId: currentSession.id,
        payload: { useFreeQuota, locale: 'vn' },
      });
      if (result.unlocked) {
        await sessionQuery.refetch();
        setNoticeMessage('Đã mở khóa tải ảnh dương bản độ phân giải cao.');
        return;
      }
      if (result.paymentUrl) {
        await openURL(result.paymentUrl);
        setNoticeMessage(
          'Đã mở cổng thanh toán VNPay. Sau khi hoàn tất, hãy nhấn "Kiểm tra trạng thái mở khóa".',
        );
      }
    } catch (err) {
      setActionError(mapNegativePreviewApiError(err));
    }
  };

  const handleDownloadHighRes = async () => {
    if (!currentSession) {
      return;
    }
    setActionError(null);
    setNoticeMessage(null);
    try {
      const downloadInfo = await downloadMutation.mutateAsync(currentSession.id);
      const saveOutcome = await saveRemotePositiveToLibrary(
        downloadInfo.downloadUrl,
        `filmlink-${currentSession.sessionCode}.jpg`,
      );
      if (saveOutcome.kind === 'saved') {
        setNoticeMessage('Đã lưu ảnh dương bản độ phân giải cao vào Thư viện ảnh.');
      } else if (saveOutcome.kind === 'opened-browser') {
        setNoticeMessage('Đã mở liên kết tải ảnh dương bản độ phân giải cao trên trình duyệt.');
      } else {
        setActionError(saveOutcome.message);
      }
    } catch (err) {
      setActionError(mapNegativePreviewApiError(err));
    }
  };

  const handleNewSession = () => {
    setActionError(null);
    setNoticeMessage(null);
    setPrintOpen(false);
    setRouteScanFileId(null);
    setRouteSessionId(null);
    setPickedBlob(undefined);
    removeDraftMediaFile(draft.localFileUri);
    createSessionMutation.reset();
    generateMutation.reset();
    void clearDraft();
  };

  const displayedError =
    actionError ?? (sessionQuery.isError ? mapNegativePreviewApiError(sessionQuery.error) : null);

  return (
    <VStack gap="md">
      <DraftRecoveryBanner
        testID="neg-preview.draft-recovery"
        visible={hasRecoverableDraft}
        pendingRetry={pendingRetry}
        lastErrorDetail={lastErrorDetail}
        lastSavedAt={lastSavedAt}
        onRestore={() => {
          setActionError(null);
          setRouteScanFileId(null);
          setRouteSessionId(null);
          void restoreDraft();
        }}
        onDiscard={handleNewSession}
      />

      <NegativePreviewStatusBanners
        displayedError={displayedError}
        noticeMessage={noticeMessage}
        isLoadingSession={sessionQuery.isLoading}
        activeSessionId={activeSessionId}
      />

      <NegativePreviewStepBody
        currentStep={currentStep}
        currentSession={currentSession}
        draft={draft}
        activeScanFileId={activeScanFileId}
        pickedBlobPresent={pickedBlob !== undefined}
        compareMode={compareMode}
        isCreatingSession={createSessionMutation.isPending}
        isGenerating={generateMutation.isPending}
        isRefreshing={sessionQuery.isFetching}
        isUnlocking={unlockMutation.isPending}
        isDownloading={downloadMutation.isPending}
        sessions={sessionsListQuery.data?.content ?? []}
        sessionsLoading={sessionsListQuery.isLoading}
        sessionsError={
          sessionsListQuery.isError ? mapNegativePreviewApiError(sessionsListQuery.error) : null
        }
        archiveRolls={archiveListQuery.data?.content ?? []}
        archiveLoading={archiveListQuery.isLoading}
        archiveError={
          archiveListQuery.isError ? mapNegativePreviewApiError(archiveListQuery.error) : null
        }
        selectedArchiveRollId={selectedArchiveRollId}
        archiveRollDetail={archiveDetailQuery.data}
        archiveDetailLoading={archiveDetailQuery.isLoading}
        onPickCamera={() => void captureNegativeFromCamera().then(applyPickOutcome)}
        onPickLibrary={() => void pickNegativeFromLibrary().then(applyPickOutcome)}
        onSelectScanFile={handleSelectScanFile}
        onClearSource={handleClearSource}
        onAnalyze={() => void handleAnalyzeSource()}
        onSelectHistorySession={(selectedId) => {
          setActionError(null);
          setNoticeMessage(null);
          setHistoryOpen(false);
          updateDraft((prev) => ({ ...prev, sessionId: selectedId }));
        }}
        onToggleHistory={setHistoryOpen}
        onSelectArchiveRoll={setSelectedArchiveRollId}
        onToggleArchive={setArchiveOpen}
        onChangePrompt={(intentPrompt) => {
          setActionError(null);
          updateDraft((prev) => ({ ...prev, intentPrompt, selectedStyleCode: null }));
        }}
        onSelectChip={handleSelectChip}
        onGenerate={() => void handleGenerate()}
        onNewSession={handleNewSession}
        onChangeCompareMode={setCompareMode}
        onRefreshSession={() => void sessionQuery.refetch()}
        onUnlockDownload={() => void handleUnlockDownload()}
        onCheckUnlock={() => void sessionQuery.refetch()}
        onDownloadHighRes={() => void handleDownloadHighRes()}
        onOpenPrint={() => {
          setActionError(null);
          setPrintOpen(true);
        }}
        onClosePrint={() => setPrintOpen(false)}
      />
    </VStack>
  );
}

export function NegativePreviewScreen() {
  const isAuthenticated = useStore(authStore, (state) => state.isAuthenticated);

  return (
    <Screen testID="neg-preview.screen" scroll edges="top">
      <VStack gap="md" className="w-full max-w-lg self-center">
        <NegativePreviewHeader />
        {isAuthenticated ? <NegativePreviewAuthenticatedBody /> : <NegativePreviewAuthGate />}
      </VStack>
    </Screen>
  );
}
