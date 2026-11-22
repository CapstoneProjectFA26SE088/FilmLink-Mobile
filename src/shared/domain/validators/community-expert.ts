import { ArticleStatus } from '../enums';

export function validateExpertApplicationExperience(experience: string): string | null {
  if (experience.trim().length < 20) {
    return 'Kinh nghiệm thực hành cần tối thiểu 20 ký tự.';
  }
  return null;
}

export function validateForumReplyContent(content: string): string | null {
  if (!content.trim()) {
    return 'Vui lòng nhập nội dung câu trả lời trước khi gửi.';
  }
  return null;
}

export function getArticleStatusBadgeMeta(status: ArticleStatus): {
  readonly label: string;
  readonly tone: 'success' | 'warning' | 'info';
} {
  switch (status) {
    case ArticleStatus.KB_APPROVED:
      return { label: 'Đã tích hợp AI Knowledge Base', tone: 'success' };
    case ArticleStatus.KB_PENDING:
      return { label: 'Chờ duyệt Knowledge Base', tone: 'warning' };
    default:
      return { label: 'Đã xuất bản cộng đồng', tone: 'info' };
  }
}
