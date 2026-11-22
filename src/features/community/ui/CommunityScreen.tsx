import { useState } from 'react';
import {
  authStore,
  type CommunityDraft,
  CommunityDraftSchema,
  createPhotoPost,
  filmLinkStore,
  Role,
} from '@/shared/domain';
import { useDraftPersistence } from '@/shared/hooks';
import { useStore } from '@/shared/lib';
import {
  Button,
  Card,
  DraftRecoveryBanner,
  Input,
  Screen,
  SegmentedControl,
  Text,
  VStack,
} from '@/shared/ui';
import type { CommunitySection } from '../model/community';
import {
  ExpertArticleCardSection,
  ForumThreadCardSection,
  PhotoPostCardSection,
} from './CommunityCardsSection';

const INITIAL_COMMUNITY_DRAFT: CommunityDraft = {
  cameraModel: 'Olympus OM-1',
  lensModel: 'Zuiko 50mm f/1.4',
  filmStock: 'Kodak Gold 200',
  developedAtLab: 'Mộc Film Lab',
  caption: 'Chiều hoàng hôn bên bến Bạch Đằng, đo sáng trung bình giữ màu nắng vàng ấm áp.',
};

function isCommunityDraftEmpty(draft: CommunityDraft): boolean {
  const matchesInitial =
    draft.cameraModel === INITIAL_COMMUNITY_DRAFT.cameraModel &&
    draft.lensModel === INITIAL_COMMUNITY_DRAFT.lensModel &&
    draft.filmStock === INITIAL_COMMUNITY_DRAFT.filmStock &&
    draft.developedAtLab === INITIAL_COMMUNITY_DRAFT.developedAtLab &&
    draft.caption === INITIAL_COMMUNITY_DRAFT.caption;
  const allTextBlank =
    draft.cameraModel.trim().length === 0 &&
    draft.lensModel.trim().length === 0 &&
    draft.filmStock.trim().length === 0 &&
    draft.developedAtLab.trim().length === 0 &&
    draft.caption.trim().length === 0;
  return matchesInitial || allTextBlank;
}

function PhotoComposerCard({ onPublished }: { readonly onPublished: () => void }) {
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
  } = useDraftPersistence<CommunityDraft>({
    flowKey: 'community_draft',
    accountId: user?.id ?? null,
    schema: CommunityDraftSchema,
    initialDraft: INITIAL_COMMUNITY_DRAFT,
    isEmpty: isCommunityDraftEmpty,
  });

  const handlePublish = () => {
    if (!draft.caption.trim()) {
      return;
    }
    createPhotoPost({
      authorName: user?.fullName ?? 'Minh Khôi Analog',
      authorRole: user?.role ?? Role.PHOTOGRAPHER,
      cameraModel: draft.cameraModel.trim() || 'Analog SLR',
      lensModel: draft.lensModel.trim() || '50mm f/1.8',
      filmStock: draft.filmStock.trim() || 'Kodak Portra 400',
      developedAtLab: draft.developedAtLab.trim() || 'Mộc Film Lab',
      caption: draft.caption.trim(),
    });
    void clearDraft();
    onPublished();
  };

  return (
    <Card tone="muted">
      <VStack gap="sm">
        <DraftRecoveryBanner
          testID="community.composer.draft-recovery"
          visible={hasRecoverableDraft}
          pendingRetry={pendingRetry}
          lastErrorDetail={lastErrorDetail}
          lastSavedAt={lastSavedAt}
          onRestore={() => void restoreDraft()}
          onDiscard={() => void clearDraft()}
        />
        <Input
          testID="community.composer.camera"
          label="Máy ảnh"
          value={draft.cameraModel}
          onChangeText={(cameraModel) => updateDraft((prev) => ({ ...prev, cameraModel }))}
        />
        <Input
          testID="community.composer.lens"
          label="Ống kính"
          value={draft.lensModel}
          onChangeText={(lensModel) => updateDraft((prev) => ({ ...prev, lensModel }))}
        />
        <Input
          testID="community.composer.film"
          label="Loại phim"
          value={draft.filmStock}
          onChangeText={(filmStock) => updateDraft((prev) => ({ ...prev, filmStock }))}
        />
        <Input
          testID="community.composer.lab"
          label="Tráng tại Lab"
          value={draft.developedAtLab}
          onChangeText={(developedAtLab) => updateDraft((prev) => ({ ...prev, developedAtLab }))}
        />
        <Input
          testID="community.composer.caption"
          label="Cảm nhận & Thông số đo sáng"
          value={draft.caption}
          onChangeText={(caption) => updateDraft((prev) => ({ ...prev, caption }))}
          multiline
        />
        <Button
          testID="community.composer.submit"
          label="Xuất bản lên Photo Feed"
          variant="primary"
          size="sm"
          onPress={handlePublish}
        />
      </VStack>
    </Card>
  );
}

export function CommunityScreen() {
  const posts = useStore(filmLinkStore, (state) => state.posts);
  const threads = useStore(filmLinkStore, (state) => state.threads);
  const articles = useStore(filmLinkStore, (state) => state.articles);
  const user = useStore(authStore, (state) => state.user);
  const role = user?.role ?? Role.PHOTOGRAPHER;

  const [section, setSection] = useState<CommunitySection>('feed');
  const [showComposer, setShowComposer] = useState(false);

  return (
    <Screen testID="community.screen" scroll edges="top">
      <VStack gap="md">
        <VStack gap="none" className="pt-2">
          <Text variant="title">Cộng đồng & Cẩm nang</Text>
          <Text variant="caption" tone="muted">
            Photo Feed EXIF, Hỏi đáp Q&A & Cẩm nang Chuyên gia
          </Text>
        </VStack>
        <SegmentedControl
          testIDPrefix="community.section"
          options={[
            { value: 'feed', label: 'Photo Feed', count: posts.length },
            { value: 'forum', label: 'Hỏi đáp Q&A', count: threads.length },
            { value: 'articles', label: 'Cẩm nang KB', count: articles.length },
          ]}
          value={section}
          onChange={setSection}
        />

        {section === 'feed' ? (
          <VStack gap="md">
            <Button
              testID="community.toggle-composer"
              label={showComposer ? 'Đóng khung đăng ảnh' : 'Đăng tác phẩm kèm thông số EXIF'}
              variant={showComposer ? 'outline' : 'secondary'}
              size="sm"
              onPress={() => setShowComposer((prev) => !prev)}
            />
            {showComposer ? <PhotoComposerCard onPublished={() => setShowComposer(false)} /> : null}
            {posts.map((post) => (
              <PhotoPostCardSection key={post.id} post={post} />
            ))}
          </VStack>
        ) : null}

        {section === 'forum'
          ? threads.map((thread) => (
              <ForumThreadCardSection
                key={thread.id}
                thread={thread}
                currentUserName={user?.fullName ?? 'Minh Khôi Analog'}
                currentUserRole={role}
              />
            ))
          : null}

        {section === 'articles'
          ? articles.map((article) => (
              <ExpertArticleCardSection key={article.id} article={article} />
            ))
          : null}
      </VStack>
    </Screen>
  );
}
