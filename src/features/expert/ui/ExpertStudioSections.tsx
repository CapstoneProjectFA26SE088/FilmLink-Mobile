import { useState } from 'react';
import {
  ARTICLE_CATEGORIES,
  authStore,
  createExpertArticle,
  createWorkshopEvent,
  draftStore,
  filmLinkStore,
  getArticleStatusBadgeMeta,
  postForumAnswer,
  Role,
  resetArticleDraft,
  toggleWorkshopAttendeeCheckIn,
  updateArticleDraft,
} from '@/shared/domain';
import { formatVnd, useStore } from '@/shared/lib';
import { Badge, Button, Card, FilterChipGroup, HStack, Input, Text, VStack } from '@/shared/ui';
import { countCheckedInAttendees } from '../model/expert';

export function ExpertArticlesSection({ expertName }: { readonly expertName: string }) {
  const articles = useStore(filmLinkStore, (state) => state.articles);
  const articleDraft = useStore(draftStore, (state) => state.articleDraft);
  const [showEditor, setShowEditor] = useState(false);

  const handlePublish = () => {
    createExpertArticle({
      title:
        articleDraft.title.trim() ||
        'Hướng dẫn kiểm soát nhiệt độ hóa chất C-41 tại buồng tối cá nhân',
      authorName: expertName,
      category: articleDraft.category,
      summary:
        articleDraft.summary.trim() ||
        'Cách giữ ổn định bể điều nhiệt 37.8°C ± 0.15°C tránh lệch màu trên phim Kodak Portra.',
      contentMarkdown:
        articleDraft.content.trim() ||
        'Sai lệch 0.5°C trong bước Developer CD-4 làm thay đổi mật độ kênh màu.',
      proposeKnowledgeBase: articleDraft.proposeKnowledgeBase,
    });
    resetArticleDraft();
    setShowEditor(false);
  };

  return (
    <VStack gap="md">
      <Button
        testID="expert.article.toggle"
        label={showEditor ? 'Đóng trình soạn bài' : 'Viết cẩm nang chuyên môn mới'}
        variant={showEditor ? 'outline' : 'primary'}
        size="sm"
        onPress={() => setShowEditor((prev) => !prev)}
      />

      {showEditor ? (
        <Card tone="muted">
          <VStack gap="sm">
            <Input
              testID="expert.article.title"
              label="Tiêu đề bài viết"
              value={articleDraft.title}
              onChangeText={(title) => updateArticleDraft({ title })}
              placeholder="Cẩm nang Zone System..."
            />
            <FilterChipGroup
              testIDPrefix="expert.article.category"
              label="Chuyên mục"
              options={ARTICLE_CATEGORIES}
              value={articleDraft.category}
              onChange={(category) => updateArticleDraft({ category })}
            />
            <Input
              testID="expert.article.summary"
              label="Tóm tắt"
              value={articleDraft.summary}
              onChangeText={(summary) => updateArticleDraft({ summary })}
            />
            <Input
              testID="expert.article.content"
              label="Nội dung (Markdown)"
              value={articleDraft.content}
              onChangeText={(content) => updateArticleDraft({ content })}
              multiline
            />
            <Button
              testID="expert.article.kb-toggle"
              label={
                articleDraft.proposeKnowledgeBase
                  ? '✓ Đề xuất tích hợp AI Knowledge Base'
                  : 'Chỉ xuất bản cộng đồng'
              }
              variant={articleDraft.proposeKnowledgeBase ? 'secondary' : 'outline'}
              size="sm"
              onPress={() =>
                updateArticleDraft({ proposeKnowledgeBase: !articleDraft.proposeKnowledgeBase })
              }
            />
            <Button
              testID="expert.article.publish"
              label="Xuất bản bài viết"
              variant="primary"
              onPress={handlePublish}
            />
          </VStack>
        </Card>
      ) : null}

      {articles.map((article) => {
        const meta = getArticleStatusBadgeMeta(article.status);
        return (
          <Card key={article.id}>
            <VStack gap="xs">
              <HStack justify="between" align="center">
                <Badge label={meta.label} tone={meta.tone} />
                <Text variant="caption" tone="muted">
                  {article.viewsCount} lượt đọc
                </Text>
              </HStack>
              <Text variant="heading">{article.title}</Text>
              <Text variant="secondary" tone="secondary">
                {article.summary}
              </Text>
            </VStack>
          </Card>
        );
      })}
    </VStack>
  );
}

export function ExpertMentorshipSection({ expertName }: { readonly expertName: string }) {
  const threads = useStore(filmLinkStore, (state) => state.threads);
  const [replyByThread, setReplyByThread] = useState<Record<string, string>>({});

  return (
    <VStack gap="md">
      {threads.map((thread) => (
        <Card key={thread.id}>
          <VStack gap="sm">
            <Badge label={thread.tag} tone="info" />
            <Text variant="heading">{thread.title}</Text>
            <Text variant="secondary" tone="secondary">
              {thread.question}
            </Text>
            <Input
              testID={`expert.mentor.input.${thread.id}`}
              value={replyByThread[thread.id] ?? ''}
              onChangeText={(text) => setReplyByThread((prev) => ({ ...prev, [thread.id]: text }))}
              placeholder="Cố vấn giải đáp chuyên môn..."
            />
            <Button
              testID={`expert.mentor.submit.${thread.id}`}
              label="Trả lời với huy hiệu Expert"
              size="sm"
              variant="secondary"
              onPress={() => {
                const text = replyByThread[thread.id] ?? '';
                if (!text.trim()) {
                  return;
                }
                postForumAnswer({
                  threadId: thread.id,
                  authorName: expertName,
                  authorRole: Role.PHOTOGRAPHY_EXPERT,
                  content: text,
                });
                setReplyByThread((prev) => ({ ...prev, [thread.id]: '' }));
              }}
            />
          </VStack>
        </Card>
      ))}
    </VStack>
  );
}

export function ExpertWorkshopsSection({ expertName }: { readonly expertName: string }) {
  const workshops = useStore(filmLinkStore, (state) => state.workshops);
  const userName = useStore(authStore, (state) => state.user?.fullName ?? expertName);
  const [showCreator, setShowCreator] = useState(false);
  const [title, setTitle] = useState('Photowalk Phố Cổ & Đo sáng C-41 nâng cao');
  const [date, setDate] = useState('2026-11-28');
  const [location, setLocation] = useState('Mộc Film Lab Studio · Quận 1');
  const [capacityText, setCapacityText] = useState('15');
  const [feeText, setFeeText] = useState('250000');

  const handleCreate = () => {
    if (!title.trim()) {
      return;
    }
    createWorkshopEvent({
      title: title.trim(),
      hostExpertName: userName,
      date: date.trim() || '2026-11-28',
      timeRange: '08:30 – 11:30',
      location: location.trim() || 'Mộc Film Lab Studio',
      capacity: Number(capacityText) || 15,
      feeVnd: Number(feeText.replace(/[^\d]/g, '')) || 250_000,
      description: 'Hướng dẫn thực hành đo sáng và phân tích kết quả scan tại Lab.',
    });
    setShowCreator(false);
  };

  return (
    <VStack gap="md">
      <Button
        testID="expert.workshop.toggle"
        label={showCreator ? 'Đóng form Workshop' : 'Tạo sự kiện Workshop mới'}
        variant={showCreator ? 'outline' : 'primary'}
        size="sm"
        onPress={() => setShowCreator((prev) => !prev)}
      />

      {showCreator ? (
        <Card tone="muted">
          <VStack gap="sm">
            <Input
              testID="expert.workshop.title"
              label="Tên Workshop"
              value={title}
              onChangeText={setTitle}
            />
            <Input
              testID="expert.workshop.date"
              label="Ngày tổ chức"
              value={date}
              onChangeText={setDate}
            />
            <Input
              testID="expert.workshop.location"
              label="Địa điểm"
              value={location}
              onChangeText={setLocation}
            />
            <Input
              testID="expert.workshop.capacity"
              label="Sức chứa"
              value={capacityText}
              onChangeText={setCapacityText}
              keyboardType="numeric"
            />
            <Input
              testID="expert.workshop.fee"
              label="Phí tham dự (VNĐ)"
              value={feeText}
              onChangeText={setFeeText}
              keyboardType="numeric"
            />
            <Button
              testID="expert.workshop.submit"
              label="Tạo Workshop"
              variant="primary"
              onPress={handleCreate}
            />
          </VStack>
        </Card>
      ) : null}

      {workshops.map((ws) => (
        <Card key={ws.id}>
          <VStack gap="sm">
            <HStack justify="between" align="center">
              <Badge label={`${ws.date} · ${ws.timeRange}`} tone="brand" />
              <Badge
                label={`${countCheckedInAttendees(ws.attendees)}/${ws.attendees.length} check-in`}
                tone="success"
              />
            </HStack>
            <Text variant="heading">{ws.title}</Text>
            <Text variant="caption" tone="secondary">
              {ws.location} · Phí {formatVnd(ws.feeVnd)}
            </Text>
            {ws.attendees.map((att) => (
              <HStack key={att.id} justify="between" align="center">
                <Text variant="caption">{att.fullName}</Text>
                <Button
                  testID={`expert.checkin.${ws.id}.${att.id}`}
                  label={att.checkedIn ? 'Đã Check-in' : 'Check-in'}
                  size="sm"
                  variant={att.checkedIn ? 'secondary' : 'outline'}
                  onPress={() => toggleWorkshopAttendeeCheckIn(ws.id, att.id)}
                />
              </HStack>
            ))}
          </VStack>
        </Card>
      ))}
    </VStack>
  );
}
