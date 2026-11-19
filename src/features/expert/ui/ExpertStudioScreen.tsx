import { router } from 'expo-router';
import { useState } from 'react';
import { authStore, Role } from '@/shared/domain';
import { useStore } from '@/shared/lib';
import { EmptyState, Screen, SegmentedControl, Text, VStack } from '@/shared/ui';
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
    <Screen testID="expert.studio.screen" scroll edges="top">
      {!hasAccess ? (
        <EmptyState
          testID="expert.studio.locked"
          actionTestID="expert.studio.open-upgrade"
          title="Khu vực dành riêng cho Chuyên gia Nhiếp ảnh"
          description="Bạn cần nâng cấp lên Chuyên gia FilmLink để xuất bản cẩm nang, cố vấn cộng đồng và tổ chức Workshop."
          actionLabel="Nộp hồ sơ nâng cấp Chuyên gia"
          onAction={() => router.push('/(modals)/expert-upgrade')}
        />
      ) : (
        <VStack gap="md">
          <VStack gap="none" className="pt-2">
            <Text variant="title">Không gian Chuyên gia</Text>
            <Text variant="caption" tone="muted">
              Expert Studio: Xuất bản cẩm nang, Cố vấn & Workshop
            </Text>
          </VStack>
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
