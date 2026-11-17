import { router } from 'expo-router';
import { useState } from 'react';
import {
  approveExpertApplicationDemo,
  authStore,
  checkRoleCapabilities,
  EXPERT_SPECIALIZATIONS,
  Role,
  submitExpertApplication,
  validateExpertApplicationExperience,
} from '@/shared/domain';
import { useStore } from '@/shared/lib';
import {
  AppHeader,
  Badge,
  Button,
  Card,
  FilterChipGroup,
  Input,
  Screen,
  Text,
  VStack,
} from '@/shared/ui';

export function ExpertUpgradeScreen() {
  const user = useStore(authStore, (state) => state.user);
  const application = useStore(authStore, (state) => state.expertApplication);
  const { isExpert } = checkRoleCapabilities(user?.role ?? Role.PHOTOGRAPHER);

  const [specialization, setSpecialization] = useState(
    EXPERT_SPECIALIZATIONS[0]?.value ?? 'Buồng tối Đen Trắng (B&W)',
  );
  const [experience, setExperience] = useState(
    '6 năm thực hành chụp và tự tráng phim 135/120 tại phòng tối cá nhân; đã viết nhiều bài hướng dẫn Zone System.',
  );
  const [portfolioUrl, setPortfolioUrl] = useState('https://filmlink.vn/portfolio/minhkhoi');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const validationError = validateExpertApplicationExperience(experience);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    submitExpertApplication({
      userId: user?.id ?? 'USR-1024',
      fullName: user?.fullName ?? 'Minh Khôi Analog',
      email: user?.email ?? 'photographer@filmlink.vn',
      specialization,
      experience: experience.trim(),
      portfolioUrl: portfolioUrl.trim(),
    });
  };

  const handleQuickActivate = () => {
    approveExpertApplicationDemo();
    router.back();
    router.push('/(tabs)/expert');
  };

  return (
    <Screen
      testID="expert.upgrade.screen"
      scroll
      header={
        <AppHeader
          title="Nâng cấp Chuyên gia (UC11)"
          subtitle="Thẩm định hồ sơ Photography Expert (BR-36)"
          showBack
          isExpert={isExpert}
        />
      }
    >
      <VStack gap="md">
        <Card tone="brand">
          <VStack gap="xs">
            <Badge label="PHOTOGRAPHY_EXPERT ⊃ PHOTOGRAPHER (BR-05)" tone="brand" />
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

        <Card>
          <VStack gap="md">
            <FilterChipGroup
              testIDPrefix="expert.upgrade.spec"
              label="Lĩnh vực chuyên môn"
              options={EXPERT_SPECIALIZATIONS}
              value={specialization}
              onChange={setSpecialization}
            />
            <Input
              testID="expert.upgrade.experience"
              label="Kinh nghiệm thực tế (>= 20 ký tự · BR-36)"
              value={experience}
              onChangeText={setExperience}
              multiline
              error={error}
            />
            <Input
              testID="expert.upgrade.portfolio"
              label="Link Portfolio"
              value={portfolioUrl}
              onChangeText={setPortfolioUrl}
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
