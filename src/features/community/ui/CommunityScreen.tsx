import { useState } from 'react';
import { authStore, createPhotoPost, filmLinkStore, Role } from '@/shared/domain';
import { useStore } from '@/shared/lib';
import { Button, Card, Input, Screen, SegmentedControl, Text, VStack } from '@/shared/ui';
import type { CommunitySection } from '../model/community';
import {
  ExpertArticleCardSection,
  ForumThreadCardSection,
  PhotoPostCardSection,
} from './CommunityCardsSection';

function PhotoComposerCard({ onPublished }: { readonly onPublished: () => void }) {
  const user = useStore(authStore, (state) => state.user);
  const [cameraModel, setCameraModel] = useState('Olympus OM-1');
  const [lensModel, setLensModel] = useState('Zuiko 50mm f/1.4');
  const [filmStock, setFilmStock] = useState('Kodak Gold 200');
  const [developedAtLab, setDevelopedAtLab] = useState('Mộc Film Lab');
  const [caption, setCaption] = useState(
    'Chiều hoàng hôn bên bến Bạch Đằng, đo sáng trung bình giữ màu nắng vàng ấm áp.',
  );

  const handlePublish = () => {
    if (!caption.trim()) {
      return;
    }
    createPhotoPost({
      authorName: user?.fullName ?? 'Minh Khôi Analog',
      authorRole: user?.role ?? Role.PHOTOGRAPHER,
      cameraModel: cameraModel.trim() || 'Analog SLR',
      lensModel: lensModel.trim() || '50mm f/1.8',
      filmStock: filmStock.trim() || 'Kodak Portra 400',
      developedAtLab: developedAtLab.trim() || 'Mộc Film Lab',
      caption: caption.trim(),
    });
    onPublished();
  };

  return (
    <Card tone="muted">
      <VStack gap="sm">
        <Input
          testID="community.composer.camera"
          label="Máy ảnh"
          value={cameraModel}
          onChangeText={setCameraModel}
        />
        <Input
          testID="community.composer.lens"
          label="Ống kính"
          value={lensModel}
          onChangeText={setLensModel}
        />
        <Input
          testID="community.composer.film"
          label="Loại phim"
          value={filmStock}
          onChangeText={setFilmStock}
        />
        <Input
          testID="community.composer.lab"
          label="Tráng tại Lab"
          value={developedAtLab}
          onChangeText={setDevelopedAtLab}
        />
        <Input
          testID="community.composer.caption"
          label="Cảm nhận & Thông số đo sáng"
          value={caption}
          onChangeText={setCaption}
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
