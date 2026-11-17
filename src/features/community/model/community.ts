import type { PhotoFeedPost } from '@/shared/domain';

export type CommunitySection = 'feed' | 'forum' | 'articles';

export function buildExifSummary(
  post: Pick<PhotoFeedPost, 'cameraModel' | 'lensModel' | 'filmStock' | 'developedAtLab'>,
): string {
  return `${post.cameraModel} · ${post.lensModel} · ${post.filmStock} @ ${post.developedAtLab}`;
}
