import { useState } from 'react';
import {
  type ExpertArticle,
  type ForumThread,
  getArticleStatusBadgeMeta,
  type PhotoFeedPost,
  postForumAnswer,
  Role,
  toggleLikePhotoPost,
  validateForumReplyContent,
} from '@/shared/domain';
import { formatDateVn } from '@/shared/lib';
import { Badge, Button, Card, HStack, Input, MediaImage, Text, VStack } from '@/shared/ui';
import { buildExifSummary } from '../model/community';

export function PhotoPostCardSection({ post }: { readonly post: PhotoFeedPost }) {
  const isExpertAuthor = post.authorRole === Role.PHOTOGRAPHY_EXPERT;
  return (
    <Card>
      <VStack gap="sm">
        <HStack justify="between" align="center">
          <VStack gap="none">
            <Text variant="heading">{post.authorName}</Text>
            <Text variant="caption" tone="muted">
              {formatDateVn(post.createdAt)}
            </Text>
          </VStack>
          <Badge
            label={isExpertAuthor ? 'Expert' : 'Photographer'}
            tone={isExpertAuthor ? 'brand' : 'neutral'}
          />
        </HStack>

        <MediaImage uri={post.imageUrl} accessibilityLabel={post.caption} />

        <Text variant="caption" tone="brand">
          {buildExifSummary(post)}
        </Text>
        <Text variant="body">{post.caption}</Text>

        <HStack justify="between" align="center">
          <Button
            testID={`community.like.${post.id}`}
            label={`${post.isLiked ? '♥' : '♡'} ${post.likesCount}`}
            size="sm"
            variant={post.isLiked ? 'secondary' : 'outline'}
            onPress={() => toggleLikePhotoPost(post.id)}
          />
          <Text variant="caption" tone="muted">
            {post.commentsCount} bình luận
          </Text>
        </HStack>
      </VStack>
    </Card>
  );
}

export function ForumThreadCardSection({
  thread,
  currentUserName,
  currentUserRole,
}: {
  readonly thread: ForumThread;
  readonly currentUserName: string;
  readonly currentUserRole: Role;
}) {
  const [replyText, setReplyText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleReply = () => {
    const validationError = validateForumReplyContent(replyText);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    postForumAnswer({
      threadId: thread.id,
      authorName: currentUserName,
      authorRole: currentUserRole,
      content: replyText,
    });
    setReplyText('');
  };

  return (
    <Card>
      <VStack gap="sm">
        <HStack justify="between" align="center">
          <Badge label={thread.tag} tone="info" />
          <Text variant="caption" tone="muted">
            {thread.viewsCount} lượt xem
          </Text>
        </HStack>
        <Text variant="heading">{thread.title}</Text>
        <Text variant="secondary" tone="secondary">
          {thread.question}
        </Text>

        {thread.answers.map((ans) => (
          <Card key={ans.id} tone={ans.isEndorsedByExpert ? 'brand' : 'muted'}>
            <VStack gap="xs">
              <HStack justify="between" align="center">
                <Text variant="secondary">{ans.authorName}</Text>
                {ans.isEndorsedByExpert ? <Badge label="Expert Endorsed" tone="success" /> : null}
              </HStack>
              <Text variant="caption">{ans.content}</Text>
            </VStack>
          </Card>
        ))}

        <Input
          testID={`community.reply-input.${thread.id}`}
          value={replyText}
          onChangeText={setReplyText}
          placeholder="Chia sẻ giải pháp kỹ thuật..."
          error={error}
        />
        <Button
          testID={`community.reply-submit.${thread.id}`}
          label="Gửi câu trả lời"
          size="sm"
          variant="secondary"
          onPress={handleReply}
        />
      </VStack>
    </Card>
  );
}

export function ExpertArticleCardSection({ article }: { readonly article: ExpertArticle }) {
  const meta = getArticleStatusBadgeMeta(article.status);
  return (
    <Card>
      <VStack gap="xs">
        <HStack justify="between" align="center">
          <Badge label={meta.label} tone={meta.tone} />
          <Text variant="caption" tone="muted">
            {article.readTimeMinutes} phút đọc
          </Text>
        </HStack>
        <Text variant="heading">{article.title}</Text>
        <Text variant="caption" tone="muted">
          {article.authorName} · {article.category}
        </Text>
        <Text variant="secondary" tone="secondary">
          {article.summary}
        </Text>
      </VStack>
    </Card>
  );
}
