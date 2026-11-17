import { router } from 'expo-router';
import { useState } from 'react';
import { authStore, Role } from '@/shared/domain';
import { useStore } from '@/shared/lib';
import { AppHeader, EmptyState, Screen, SegmentedControl, VStack } from '@/shared/ui';
import { canAccessExpertStudio, type StudioTab } from '../model/expert';
import {
  ExpertArticlesSection,
  ExpertMentorshipSection,
  ExpertWorkshopsSection,
} from './ExpertStudioSections';

export function ExpertStudioScreen() {
  const user = useStore(authStore, (state) => state.user);
  const role = user?.role ?? Role.PHOTOGRAPHER;
  const hasAccess = canAccessExpertStudio(role);
  const expertName = user?.fullName ?? 'Đặng Quốc Bảo (Expert)';
  const [studioTab, setStudioTab] = useState<StudioTab>('articles');

  return (
    <Screen
      testID="expert.studio.screen"
      scroll
      edges="top"
      header={
        <AppHeader
          title="Không gian Chuyên gia"
          subtitle="Expert Studio: Xuất bản KB, Cố vấn & Workshop"
          isExpert={hasAccess}
        />
      }
    >
      {!hasAccess ? (
        <EmptyState
          testID="expert.studio.locked"
          actionTestID="expert.studio.open-upgrade"
          title="Khu vực dành riêng cho Photography Expert"
          description="Theo phân cấp vai trò BR-05 (PHOTOGRAPHY_EXPERT ⊃ PHOTOGRAPHER), bạn cần nâng cấp lên Chuyên gia để truy cập."
          actionLabel="Nộp hồ sơ nâng cấp Chuyên gia (UC11)"
          onAction={() => router.push('/(modals)/expert-upgrade')}
        />
      ) : (
        <VStack gap="md">
          <SegmentedControl
            testIDPrefix="expert.studio.tab"
            options={[
              { value: 'articles', label: 'Bài viết KB' },
              { value: 'mentorship', label: 'Cố vấn Q&A' },
              { value: 'workshops', label: 'Workshops' },
            ]}
            value={studioTab}
            onChange={setStudioTab}
          />
          {studioTab === 'articles' ? <ExpertArticlesSection expertName={expertName} /> : null}
          {studioTab === 'mentorship' ? <ExpertMentorshipSection expertName={expertName} /> : null}
          {studioTab === 'workshops' ? <ExpertWorkshopsSection expertName={expertName} /> : null}
        </VStack>
      )}
    </Screen>
  );
}
