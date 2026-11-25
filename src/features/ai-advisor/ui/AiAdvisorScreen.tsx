import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, router } from 'expo-router';
import { useState } from 'react';
import {
  type AskChatbotQuestionRequest,
  filmLinkApi,
  filmLinkQueryKeys,
  ORDER_STALE_TIME_MS,
} from '@/shared/api';
import {
  type AiAdvisorDraft,
  AiAdvisorDraftSchema,
  authStore,
  ErrorCode,
  SUGGESTED_PROMPTS,
} from '@/shared/domain';
import { useDraftPersistence } from '@/shared/hooks';
import { hasErrorCode, useStore } from '@/shared/lib';
import {
  Alert,
  Badge,
  Button,
  Card,
  DraftRecoveryBanner,
  HStack,
  Input,
  Screen,
  Text,
  VStack,
} from '@/shared/ui';
import {
  buildDisplayMessages,
  buildLiveChatbotTurn,
  type ChatbotDisplayMessage,
  type LiveChatbotTurn,
  mapChatbotApiError,
  validateChatbotQuestion,
} from '../model/ai-advisor';

const INITIAL_AI_ADVISOR_DRAFT: AiAdvisorDraft = {
  sessionId: null,
  prompt: '',
};

function isAiAdvisorDraftEmpty(draft: AiAdvisorDraft): boolean {
  return draft.sessionId === null && draft.prompt.trim().length === 0;
}

function MessageBubbleCard({ message }: { readonly message: ChatbotDisplayMessage }) {
  const isAssistant = message.sender === 'ASSISTANT';
  return (
    <Card tone={isAssistant ? 'brand' : 'default'}>
      <VStack gap="xs">
        <HStack justify="between" align="center">
          <Badge
            label={isAssistant ? 'FilmLink AI' : 'Bạn'}
            tone={isAssistant ? 'brand' : 'neutral'}
          />
          {message.fallback ? <Badge label="Ngoài Cẩm nang" tone="warning" /> : null}
        </HStack>
        <Text variant="secondary">{message.content}</Text>
        {message.citations.length > 0 ? (
          <HStack gap="xs" className="flex-wrap">
            {message.citations.map((citation) => (
              <Badge
                key={citation.articleId}
                label={`Cẩm nang #${citation.articleId}: ${citation.title}`}
                tone="info"
              />
            ))}
          </HStack>
        ) : null}
      </VStack>
    </Card>
  );
}

export type AiAdvisorMode = 'tab' | 'modal';

export type AiAdvisorScreenProps = {
  readonly mode?: AiAdvisorMode;
};

function AiAdvisorHeader({ mode }: { readonly mode: AiAdvisorMode }) {
  return (
    <HStack justify="between" align="center" className="pt-2">
      <VStack gap="none" className="flex-1">
        <Text variant="title">Trợ lý AI FilmLink</Text>
        <Text variant="caption" tone="muted">
          Hỏi đáp Cẩm nang Chuyên gia (RAG) theo phiên
        </Text>
      </VStack>
      {mode === 'modal' ? (
        <Button
          testID="ai.back"
          label="Đóng"
          variant="ghost"
          size="sm"
          onPress={() => router.back()}
        />
      ) : null}
    </HStack>
  );
}

function NegativePreviewStudioCard() {
  return (
    <Card tone="brand">
      <VStack gap="sm">
        <Badge label="Âm bản → Dương bản & In Lab" tone="brand" />
        <Text variant="heading">AI Negative-to-Positive Studio</Text>
        <Text variant="secondary" tone="secondary">
          Chụp ảnh âm bản hoặc chọn từ thư viện và Lưu trữ số để xem thử dương bản theo mô tả ngôn
          ngữ tự nhiên (không thanh chỉnh thủ công), mở khóa ảnh gốc và đặt in Lab.
        </Text>
        <Button
          testID="ai.open-negative-preview"
          label="Mở Xem thử Dương bản AI"
          variant="primary"
          onPress={() => router.push('/(modals)/negative-preview' as Href)}
        />
      </VStack>
    </Card>
  );
}

function AiAuthPromptSection() {
  return (
    <VStack gap="sm">
      <Alert
        testID="ai.auth-required"
        tone="info"
        message="Đăng nhập tài khoản FilmLink để gửi câu hỏi và lưu lịch sử phiên với Trợ lý AI."
      />
      <Button
        testID="ai.login"
        label="Đăng nhập để hỏi AI"
        variant="primary"
        onPress={() => router.push('/(auth)/login')}
      />
    </VStack>
  );
}

export function AiAdvisorScreen({ mode = 'tab' }: AiAdvisorScreenProps) {
  const queryClient = useQueryClient();
  const user = useStore(authStore, (state) => state.user);
  const isAuthenticated = useStore(authStore, (state) => state.isAuthenticated);
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
  } = useDraftPersistence<AiAdvisorDraft>({
    flowKey: 'ai_advisor_draft',
    accountId: user?.id ?? null,
    schema: AiAdvisorDraftSchema,
    initialDraft: INITIAL_AI_ADVISOR_DRAFT,
    isEmpty: isAiAdvisorDraftEmpty,
  });

  const [liveTurns, setLiveTurns] = useState<readonly LiveChatbotTurn[]>([]);
  const [latestFallback, setLatestFallback] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const activeSessionId = draft.sessionId;
  const messagesQuery = useQuery({
    queryKey: filmLinkQueryKeys.chatbot.messages(activeSessionId ?? 0, { size: 100 }),
    queryFn: () => filmLinkApi.fetchChatbotSessionMessages(activeSessionId ?? 0, { size: 100 }),
    enabled: isAuthenticated && activeSessionId !== null,
    staleTime: ORDER_STALE_TIME_MS,
  });

  const askMutation = useMutation({
    mutationFn: (payload: AskChatbotQuestionRequest) => filmLinkApi.askChatbotQuestion(payload),
  });

  const displayMessages = buildDisplayMessages(
    messagesQuery.data?.content,
    liveTurns,
    activeSessionId,
    latestFallback,
  );
  const hasFallbackNotice = latestFallback || displayMessages.some((msg) => msg.fallback);
  const queryError = messagesQuery.isError ? mapChatbotApiError(messagesQuery.error) : null;
  const submitError = askMutation.isError ? mapChatbotApiError(askMutation.error) : null;
  const displayedError = validationError ?? submitError ?? queryError;

  const handleResetSession = () => {
    setLiveTurns([]);
    setLatestFallback(false);
    setValidationError(null);
    askMutation.reset();
    void clearDraft();
  };

  const handleSend = async (customPrompt?: string) => {
    const question = (customPrompt ?? draft.prompt).trim();
    if (!isAuthenticated) {
      setValidationError('Vui lòng đăng nhập để trò chuyện cùng Trợ lý AI FilmLink.');
      return;
    }
    const validation = validateChatbotQuestion(question);
    if (validation) {
      setValidationError(validation);
      return;
    }
    setValidationError(null);
    try {
      const response = await askMutation.mutateAsync({
        question,
        sessionId: activeSessionId,
      });
      setLiveTurns((prev) => [
        ...prev,
        buildLiveChatbotTurn(question, response, new Date().toISOString(), prev.length + 1),
      ]);
      setLatestFallback(response.fallback);
      updateDraft((prev) => ({
        sessionId: response.sessionId,
        prompt: customPrompt ? prev.prompt : '',
      }));
      void queryClient.invalidateQueries({
        queryKey: filmLinkQueryKeys.chatbot.messages(response.sessionId),
      });
    } catch (error) {
      await markSubmissionFailed(error);
      if (hasErrorCode(error, ErrorCode.AI_CHAT_SESSION_NOT_FOUND)) {
        updateDraft((prev) => ({ ...prev, sessionId: null }));
      }
    }
  };

  const handleOpenServices = () => {
    if (mode === 'modal') {
      router.back();
    }
    router.push('/(tabs)/services');
  };

  return (
    <Screen testID="ai.screen" scroll edges="top">
      <VStack gap="md">
        <AiAdvisorHeader mode={mode} />
        <NegativePreviewStudioCard />

        {!isAuthenticated ? <AiAuthPromptSection /> : null}

        <DraftRecoveryBanner
          testID="ai.chat.draft-recovery"
          visible={hasRecoverableDraft}
          pendingRetry={pendingRetry}
          lastErrorDetail={lastErrorDetail}
          lastSavedAt={lastSavedAt}
          onRestore={() => {
            setValidationError(null);
            void restoreDraft();
          }}
          onDiscard={handleResetSession}
        />

        <VStack gap="xs">
          {SUGGESTED_PROMPTS.map((suggestion, idx) => (
            <Button
              key={suggestion}
              testID={`ai.suggest.${idx}`}
              label={suggestion}
              variant="outline"
              size="sm"
              disabled={askMutation.isPending}
              onPress={() => void handleSend(suggestion)}
            />
          ))}
        </VStack>

        {isAuthenticated && activeSessionId !== null && messagesQuery.isLoading ? (
          <Card testID="ai.chat.loading" tone="muted">
            <Text variant="secondary" tone="muted">
              Đang tải lịch sử phiên trò chuyện #{activeSessionId}...
            </Text>
          </Card>
        ) : null}

        {displayMessages.map((msg) => (
          <MessageBubbleCard key={msg.id} message={msg} />
        ))}

        {hasFallbackNotice ? (
          <Alert
            testID="ai.chat.fallback"
            tone="warning"
            message="Câu trả lời gần nhất được tổng hợp ngoài Cẩm nang Chuyên gia do chưa có bài viết khớp hoàn toàn."
          />
        ) : null}

        {displayedError ? (
          <Alert testID="ai.chat.error" tone="danger" message={displayedError} />
        ) : null}

        <Input
          testID="ai.chat.input"
          label="Đặt câu hỏi về phim & hóa chất (5 - 1000 ký tự)"
          value={draft.prompt}
          onChangeText={(prompt) => {
            setValidationError(null);
            updateDraft((prev) => ({ ...prev, prompt }));
          }}
          placeholder="Ví dụ: Nên tráng ECN-2 ở đâu và nhiệt độ bao nhiêu?"
        />
        <Button
          testID="ai.chat.send"
          label={askMutation.isPending ? 'Đang hỏi Trợ lý AI...' : 'Gửi câu hỏi AI'}
          variant="primary"
          loading={askMutation.isPending}
          onPress={() => void handleSend()}
        />
        {activeSessionId !== null || messagesQuery.isError ? (
          <Button
            testID="ai.chat.new-session"
            label="Cuộc trò chuyện mới"
            variant="outline"
            onPress={handleResetSession}
          />
        ) : null}
        <Button
          testID="ai.chat.open-services"
          label="Mở Danh bạ Phòng Lab"
          variant="secondary"
          onPress={handleOpenServices}
        />
      </VStack>
    </Screen>
  );
}
