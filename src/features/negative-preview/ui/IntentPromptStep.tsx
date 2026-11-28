import type { NegativePreviewSessionResponse, SuggestedIntentChip } from '@/shared/api';
import { Badge, Button, Card, HStack, Icon, Input, MediaImage, Text, VStack } from '@/shared/ui';
import { DETECTED_BASE_TYPE_LABELS, INTENT_PROMPT_MAX_LENGTH } from '../model/negative-preview';

export type IntentPromptStepProps = {
  readonly session: NegativePreviewSessionResponse;
  readonly localFileUri: string | null;
  readonly intentPrompt: string;
  readonly selectedStyleCode: string | null;
  readonly isGenerating: boolean;
  readonly onChangePrompt: (prompt: string) => void;
  readonly onSelectChip: (chip: SuggestedIntentChip) => void;
  readonly onGenerate: () => void;
  readonly onNewSession: () => void;
};

export function IntentPromptStep({
  session,
  localFileUri,
  intentPrompt,
  selectedStyleCode,
  isGenerating,
  onChangePrompt,
  onSelectChip,
  onGenerate,
  onNewSession,
}: IntentPromptStepProps) {
  const previewSourceUri = session.baseInvertedSignedUrl ?? session.sourceSignedUrl ?? localFileUri;

  return (
    <VStack gap="md">
      <Card tone="brand">
        <VStack gap="sm">
          <HStack justify="between" align="center">
            <Badge label="Bước 2 · Mô tả phong cách" tone="brand" />
            <Badge label={DETECTED_BASE_TYPE_LABELS[session.detectedBaseType]} tone="neutral" />
          </HStack>

          {previewSourceUri ? (
            <MediaImage
              uri={previewSourceUri}
              accessibilityLabel="Ảnh âm bản đã phân tích"
              resizeMode="contain"
              className="h-48 w-full rounded-lg"
            />
          ) : null}

          {session.exposureDiagnosisVn ? (
            <Text variant="secondary">{session.exposureDiagnosisVn}</Text>
          ) : null}
          {session.aiInspectionSummaryVn ? (
            <Text variant="caption" tone="secondary">
              {session.aiInspectionSummaryVn}
            </Text>
          ) : null}
          {session.assistantQuestionVn ? (
            <Text variant="heading">{session.assistantQuestionVn}</Text>
          ) : null}
        </VStack>
      </Card>

      {session.suggestedIntents.length > 0 ? (
        <Card>
          <VStack gap="xs">
            <Text variant="caption" tone="muted">
              Gợi ý phong cách từ AI (chọn nhanh hoặc tự mô tả):
            </Text>
            <VStack gap="xs">
              {session.suggestedIntents.map((chip) => (
                <Button
                  key={chip.code}
                  testID={`neg-preview.chip.${chip.code}`}
                  label={chip.labelVn}
                  size="sm"
                  variant={selectedStyleCode === chip.code ? 'primary' : 'outline'}
                  disabled={isGenerating}
                  onPress={() => onSelectChip(chip)}
                />
              ))}
            </VStack>
          </VStack>
        </Card>
      ) : null}

      <Card>
        <VStack gap="sm">
          <Input
            testID="neg-preview.intent-input"
            label="Mô tả màu sắc & không khí dương bản (3 - 500 ký tự)"
            required
            multiline
            value={intentPrompt}
            onChangeText={(text) => onChangePrompt(text.slice(0, INTENT_PROMPT_MAX_LENGTH))}
            placeholder="Ví dụ: Tông ấm Kodak Portra tự nhiên, giữ chi tiết vùng tối"
            helperText={`${intentPrompt.trim().length}/${INTENT_PROMPT_MAX_LENGTH} ký tự · Chỉnh bằng mô tả tự nhiên`}
          />
          <Button
            testID="neg-preview.generate"
            label={isGenerating ? 'Đang tạo dương bản AI...' : 'Tạo bản xem thử dương bản'}
            variant="primary"
            icon={<Icon name="sparkles-outline" size="sm" tone="inverse" />}
            loading={isGenerating}
            disabled={isGenerating}
            onPress={onGenerate}
          />
          <Button
            testID="neg-preview.new-session"
            label="Chọn âm bản khác"
            variant="ghost"
            size="sm"
            disabled={isGenerating}
            onPress={onNewSession}
          />
        </VStack>
      </Card>
    </VStack>
  );
}
