import { router } from 'expo-router';
import { useState } from 'react';
import {
  type AiAdvisorDraft,
  AiAdvisorDraftSchema,
  type AiChatMessage,
  analyzeFilmScanQuality,
  authStore,
  type ScanQualityAnalysis,
  SUGGESTED_PROMPTS,
} from '@/shared/domain';
import { useDraftPersistence } from '@/shared/hooks';
import { useStore } from '@/shared/lib';
import {
  Badge,
  Button,
  Card,
  DraftRecoveryBanner,
  HStack,
  Input,
  Screen,
  SegmentedControl,
  Text,
  VStack,
} from '@/shared/ui';
import { appendAdvisoryTurn } from '../model/ai-advisor';

const INITIAL_MESSAGES: readonly AiChatMessage[] = [
  {
    id: 'AI-WELCOME',
    sender: 'AI',
    text: 'Xin chào! Tôi là Trợ lý AI FilmLink được huấn luyện từ Cẩm nang Chuyên gia (Knowledge Base). Bạn cần tư vấn thông số đo sáng hay kiểm tra lỗi khung phim?',
    timestamp: '2026-11-01T00:00:00Z',
  },
];

const INITIAL_AI_ADVISOR_DRAFT: AiAdvisorDraft = {
  mode: 'chat',
  prompt: '',
  frameText: '12',
};

function isAiAdvisorDraftEmpty(draft: AiAdvisorDraft): boolean {
  return (
    draft.mode === 'chat' && draft.prompt.trim().length === 0 && draft.frameText.trim() === '12'
  );
}

export function AiAdvisorScreen() {
  const user = useStore(authStore, (state) => state.user);
  const {
    draft,
    hasRecoverableDraft,
    pendingRetry,
    lastErrorDetail,
    lastSavedAt,
    updateDraft,
    restoreDraft,
    clearDraft,
  } = useDraftPersistence<AiAdvisorDraft>({
    flowKey: 'ai_advisor_draft',
    accountId: user?.id ?? null,
    schema: AiAdvisorDraftSchema,
    initialDraft: INITIAL_AI_ADVISOR_DRAFT,
    isEmpty: isAiAdvisorDraftEmpty,
  });
  const [messages, setMessages] = useState<readonly AiChatMessage[]>(INITIAL_MESSAGES);
  const [report, setReport] = useState<ScanQualityAnalysis | null>(null);

  const handleSend = (customPrompt?: string) => {
    const query = customPrompt ?? draft.prompt;
    if (!query.trim()) {
      return;
    }
    setMessages((prev) => appendAdvisoryTurn(prev, query));
    if (!customPrompt) {
      updateDraft((prev) => ({ ...prev, prompt: '' }));
      if (draft.frameText.trim() === '12' && draft.mode === 'chat') {
        void clearDraft();
      }
    }
  };

  return (
    <Screen testID="ai.screen" scroll edges="top">
      <VStack gap="md">
        <HStack justify="between" align="center" className="pt-2">
          <VStack gap="none" className="flex-1">
            <Text variant="title">Trợ lý AI FilmLink</Text>
            <Text variant="caption" tone="muted">
              Tư vấn Knowledge Base & Chẩn đoán Scan
            </Text>
          </VStack>
          <Button
            testID="ai.back"
            label="Đóng"
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
          />
        </HStack>
        <SegmentedControl
          testIDPrefix="ai.mode"
          options={[
            { value: 'chat', label: 'Hỏi đáp Cẩm nang AI' },
            { value: 'diagnostics', label: 'Chẩn đoán Khung Scan' },
          ]}
          value={draft.mode}
          onChange={(mode) => updateDraft((prev) => ({ ...prev, mode }))}
        />

        <DraftRecoveryBanner
          testID="ai.chat.draft-recovery"
          visible={hasRecoverableDraft}
          pendingRetry={pendingRetry}
          lastErrorDetail={lastErrorDetail}
          lastSavedAt={lastSavedAt}
          onRestore={() => void restoreDraft()}
          onDiscard={() => void clearDraft()}
        />

        {draft.mode === 'chat' ? (
          <VStack gap="md">
            <VStack gap="xs">
              {SUGGESTED_PROMPTS.map((suggestion, idx) => (
                <Button
                  key={suggestion}
                  testID={`ai.suggest.${idx}`}
                  label={suggestion}
                  variant="outline"
                  size="sm"
                  onPress={() => handleSend(suggestion)}
                />
              ))}
            </VStack>

            {messages.map((msg) => (
              <Card key={msg.id} tone={msg.sender === 'AI' ? 'brand' : 'default'}>
                <VStack gap="xs">
                  <Badge
                    label={msg.sender === 'AI' ? 'FilmLink AI' : 'Bạn'}
                    tone={msg.sender === 'AI' ? 'brand' : 'neutral'}
                  />
                  <Text variant="secondary">{msg.text}</Text>
                </VStack>
              </Card>
            ))}

            <Input
              testID="ai.chat.input"
              label="Đặt câu hỏi về phim & hóa chất"
              value={draft.prompt}
              onChangeText={(prompt) => updateDraft((prev) => ({ ...prev, prompt }))}
              placeholder="Ví dụ: Nên tráng ECN-2 ở đâu?"
            />
            <Button
              testID="ai.chat.send"
              label="Gửi câu hỏi AI"
              variant="primary"
              onPress={() => handleSend()}
            />
            <Button
              testID="ai.chat.open-services"
              label="Mở Danh bạ Phòng Lab"
              variant="secondary"
              onPress={() => {
                router.back();
                router.push('/(tabs)/services');
              }}
            />
          </VStack>
        ) : (
          <Card>
            <VStack gap="md">
              <Input
                testID="ai.diag.frame"
                label="Số thứ tự khung phim cần kiểm tra"
                value={draft.frameText}
                onChangeText={(frameText) => updateDraft((prev) => ({ ...prev, frameText }))}
                keyboardType="numeric"
              />
              <Button
                testID="ai.diag.run"
                label="Phân tích chất lượng Scan"
                variant="primary"
                onPress={() => setReport(analyzeFilmScanQuality(Number(draft.frameText) || 1))}
              />
              {report ? (
                <Card tone="success">
                  <VStack gap="xs">
                    <Badge label={`Điểm chất lượng: ${report.overallScore}/100`} tone="success" />
                    <Text variant="caption">{report.exposureAssessment}</Text>
                    <Text variant="caption">{report.dustAndScratchReport}</Text>
                    <Text variant="caption">{report.colorBalanceNote}</Text>
                    <Text variant="secondary" tone="success">
                      {report.recommendation}
                    </Text>
                  </VStack>
                </Card>
              ) : null}
            </VStack>
          </Card>
        )}
      </VStack>
    </Screen>
  );
}
