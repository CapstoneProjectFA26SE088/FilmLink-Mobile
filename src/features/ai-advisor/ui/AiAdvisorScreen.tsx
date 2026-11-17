import { router } from 'expo-router';
import { useState } from 'react';
import {
  type AiChatMessage,
  analyzeFilmScanQuality,
  type ScanQualityAnalysis,
  SUGGESTED_PROMPTS,
} from '@/shared/domain';
import {
  AppHeader,
  Badge,
  Button,
  Card,
  Input,
  Screen,
  SegmentedControl,
  Text,
  VStack,
} from '@/shared/ui';
import { type AdvisorMode, appendAdvisoryTurn } from '../model/ai-advisor';

const INITIAL_MESSAGES: readonly AiChatMessage[] = [
  {
    id: 'AI-WELCOME',
    sender: 'AI',
    text: 'Xin chào! Tôi là Trợ lý AI FilmLink được huấn luyện từ Cẩm nang Chuyên gia (Knowledge Base). Bạn cần tư vấn thông số đo sáng hay kiểm tra lỗi khung phim?',
    timestamp: '2026-11-01T00:00:00Z',
  },
];

export function AiAdvisorScreen() {
  const [mode, setMode] = useState<AdvisorMode>('chat');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<readonly AiChatMessage[]>(INITIAL_MESSAGES);
  const [frameText, setFrameText] = useState('12');
  const [report, setReport] = useState<ScanQualityAnalysis | null>(null);

  const handleSend = (customPrompt?: string) => {
    const query = customPrompt ?? prompt;
    if (!query.trim()) {
      return;
    }
    setMessages((prev) => appendAdvisoryTurn(prev, query));
    if (!customPrompt) {
      setPrompt('');
    }
  };

  return (
    <Screen
      testID="ai.screen"
      scroll
      header={
        <AppHeader
          title="Trợ lý AI FilmLink"
          subtitle="Tư vấn Knowledge Base & Chẩn đoán Scan"
          showBack
          showRoleBadge={false}
        />
      }
    >
      <VStack gap="md">
        <SegmentedControl
          testIDPrefix="ai.mode"
          options={[
            { value: 'chat', label: 'Hỏi đáp Cẩm nang AI' },
            { value: 'diagnostics', label: 'Chẩn đoán Khung Scan' },
          ]}
          value={mode}
          onChange={setMode}
        />

        {mode === 'chat' ? (
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
              value={prompt}
              onChangeText={setPrompt}
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
                value={frameText}
                onChangeText={setFrameText}
                keyboardType="numeric"
              />
              <Button
                testID="ai.diag.run"
                label="Phân tích chất lượng Scan"
                variant="primary"
                onPress={() => setReport(analyzeFilmScanQuality(Number(frameText) || 1))}
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
