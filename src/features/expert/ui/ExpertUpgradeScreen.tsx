import { router } from 'expo-router';
import { useState } from 'react';
import {
  approveExpertApplicationDemo,
  authStore,
  EXPERT_SPECIALIZATIONS,
  type ExpertUpgradeDraft,
  ExpertUpgradeDraftSchema,
  submitExpertApplication,
  validateExpertApplicationExperience,
} from '@/shared/domain';
import { useDraftPersistence } from '@/shared/hooks';
import { useStore } from '@/shared/lib';
import {
  Badge,
  Button,
  Card,
  DraftRecoveryBanner,
  FilterChipGroup,
  HStack,
  Input,
  Screen,
  Text,
  VStack,
} from '@/shared/ui';

const INITIAL_EXPERT_UPGRADE_DRAFT: ExpertUpgradeDraft = {
  specialization: EXPERT_SPECIALIZATIONS[0]?.value ?? 'Buồng tối Đen Trắng (B&W)',
  experience:
    '6 năm thực hành chụp và tự tráng phim 135/120 tại phòng tối cá nhân; đã viết nhiều bài hướng dẫn Zone System.',
  portfolioUrl: 'https://filmlink.vn/portfolio/minhkhoi',
};

function isExpertUpgradeDraftEmpty(draft: ExpertUpgradeDraft): boolean {
  const matchesInitial =
    draft.specialization === INITIAL_EXPERT_UPGRADE_DRAFT.specialization &&
    draft.experience === INITIAL_EXPERT_UPGRADE_DRAFT.experience &&
    draft.portfolioUrl === INITIAL_EXPERT_UPGRADE_DRAFT.portfolioUrl;
  const textBlank = draft.experience.trim().length === 0 && draft.portfolioUrl.trim().length === 0;
  return matchesInitial || textBlank;
}

export function ExpertUpgradeScreen() {
  const user = useStore(authStore, (state) => state.user);
  const application = useStore(authStore, (state) => state.expertApplication);

  const {
    draft,
    hasRecoverableDraft,
    pendingRetry,
    lastErrorDetail,
    lastSavedAt,
    updateDraft,
    restoreDraft,
    clearDraft,
  } = useDraftPersistence<ExpertUpgradeDraft>({
    flowKey: 'expert_draft',
    accountId: user?.id ?? null,
    schema: ExpertUpgradeDraftSchema,
    initialDraft: INITIAL_EXPERT_UPGRADE_DRAFT,
    isEmpty: isExpertUpgradeDraftEmpty,
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const validationError = validateExpertApplicationExperience(draft.experience);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    submitExpertApplication({
      userId: user?.id ?? 'USR-1024',
      fullName: user?.fullName ?? 'Minh Khôi Analog',
      email: user?.email ?? 'photographer@filmlink.vn',
      specialization: draft.specialization,
      experience: draft.experience.trim(),
      portfolioUrl: draft.portfolioUrl.trim(),
    });
    void clearDraft();
  };

  const handleQuickActivate = () => {
    approveExpertApplicationDemo();
    router.back();
    router.push('/(tabs)/expert');
  };

  return (
    <Screen testID="expert.upgrade.screen" scroll edges="top">
      <VStack gap="md">
        <HStack justify="between" align="center" className="pt-2">
          <VStack gap="none" className="flex-1">
            <Text variant="title">Nâng cấp Chuyên gia</Text>
            <Text variant="caption" tone="muted">
              Thẩm định hồ sơ Chuyên gia Nhiếp ảnh
            </Text>
          </VStack>
          <Button
            testID="expert.upgrade.back"
            label="Quay lại"
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
          />
        </HStack>
        <Card tone="brand">
          <VStack gap="xs">
            <Badge label="ĐẶC QUYỀN CHUYÊN GIA" tone="brand" />
            <Text variant="heading">Đặc quyền Kế thừa Vai trò</Text>
            <Text variant="secondary" tone="secondary">
              Khi nâng cấp lên Chuyên gia, bạn giữ nguyên 100% tính năng Photographer và mở khóa tab
              Expert Studio.
            </Text>
          </VStack>
        </Card>

        {application ? (
          <Card tone={application.status === 'APPROVED' ? 'success' : 'warning'}>
            <VStack gap="xs">
              <Text variant="heading">Hồ sơ {application.id}</Text>
              <Badge
                label={application.status}
                tone={application.status === 'APPROVED' ? 'success' : 'warning'}
              />
              <Text variant="caption">{application.specialization}</Text>
            </VStack>
          </Card>
        ) : null}

        <DraftRecoveryBanner
          testID="expert.upgrade.draft-recovery"
          visible={hasRecoverableDraft}
          pendingRetry={pendingRetry}
          lastErrorDetail={lastErrorDetail}
          lastSavedAt={lastSavedAt}
          onRestore={() => void restoreDraft()}
          onDiscard={() => void clearDraft()}
        />

        <Card>
          <VStack gap="md">
            <FilterChipGroup
              testIDPrefix="expert.upgrade.spec"
              label="Lĩnh vực chuyên môn"
              options={EXPERT_SPECIALIZATIONS}
              value={draft.specialization}
              onChange={(specialization) => updateDraft((prev) => ({ ...prev, specialization }))}
            />
            <Input
              testID="expert.upgrade.experience"
              label="Kinh nghiệm thực tế (>= 20 ký tự · BR-36)"
              value={draft.experience}
              onChangeText={(experience) => updateDraft((prev) => ({ ...prev, experience }))}
              multiline
              error={error}
            />
            <Input
              testID="expert.upgrade.portfolio"
              label="Link Portfolio"
              value={draft.portfolioUrl}
              onChangeText={(portfolioUrl) => updateDraft((prev) => ({ ...prev, portfolioUrl }))}
              autoCapitalize="none"
            />
            <Button
              testID="expert.upgrade.submit"
              label="Nộp hồ sơ thẩm định"
              variant="primary"
              onPress={handleSubmit}
            />
            <Button
              testID="expert.upgrade.quick-demo"
              label="Kích hoạt Expert Demo ngay"
              variant="secondary"
              onPress={handleQuickActivate}
            />
          </VStack>
        </Card>
      </VStack>
    </Screen>
  );
}
