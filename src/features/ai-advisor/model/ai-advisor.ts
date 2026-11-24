import type {
  ChatbotAnswerResponse,
  ChatbotCitationResponse,
  ChatbotMessageResponse,
  ChatbotMessageSender,
} from '@/shared/api';
import { ErrorCode } from '@/shared/domain';
import { getErrorMessage, hasErrorCode, isNetworkError } from '@/shared/lib';

export const CHATBOT_QUESTION_MIN_LENGTH = 5;
export const CHATBOT_QUESTION_MAX_LENGTH = 1000;

export type ChatbotDisplayMessage = {
  readonly id: string;
  readonly sender: ChatbotMessageSender;
  readonly content: string;
  readonly citations: readonly ChatbotCitationResponse[];
  readonly fallback: boolean;
  readonly createdAt: string;
};

export type LiveChatbotTurn = {
  readonly sessionId: number;
  readonly userMessage: ChatbotDisplayMessage;
  readonly assistantMessage: ChatbotDisplayMessage;
};

export function validateChatbotQuestion(question: string): string | null {
  const trimmed = question.trim();
  if (trimmed.length < CHATBOT_QUESTION_MIN_LENGTH) {
    return 'Câu hỏi cần tối thiểu 5 ký tự để Trợ lý AI hiểu đúng ngữ cảnh.';
  }
  if (trimmed.length > CHATBOT_QUESTION_MAX_LENGTH) {
    return 'Câu hỏi không được vượt quá 1000 ký tự.';
  }
  return null;
}

export function mapChatbotApiError(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Không thể kết nối tới máy chủ FilmLink. Vui lòng kiểm tra mạng.';
  }
  if (hasErrorCode(error, ErrorCode.AI_CHAT_SESSION_NOT_FOUND)) {
    return 'Phiên trò chuyện AI không tồn tại hoặc đã hết hạn. Bạn có thể gửi lại để mở phiên mới.';
  }
  if (hasErrorCode(error, ErrorCode.AI_PROVIDER_UNAVAILABLE)) {
    return 'Hệ thống AI tạm thời quá tải hoặc gián đoạn. Vui lòng thử lại sau ít phút.';
  }
  if (hasErrorCode(error, ErrorCode.AUTHENTICATION_REQUIRED)) {
    return 'Vui lòng đăng nhập để trò chuyện cùng Trợ lý AI FilmLink.';
  }
  return getErrorMessage(error);
}

export function buildInitialWelcomeMessage(): ChatbotDisplayMessage {
  return {
    id: 'AI-WELCOME',
    sender: 'ASSISTANT',
    content:
      'Xin chào! Tôi là Trợ lý AI FilmLink dựa trên Cẩm nang Chuyên gia (RAG). Hãy đặt câu hỏi về chọn phim, hóa chất, đẩy/kéo ISO hoặc xử lý sự cố buồng tối.',
    citations: [],
    fallback: false,
    createdAt: '2026-11-01T00:00:00Z',
  };
}

export function fromChatbotMessageResponse(message: ChatbotMessageResponse): ChatbotDisplayMessage {
  return {
    id: String(message.id),
    sender: message.sender,
    content: message.content,
    citations: message.citations,
    fallback: false,
    createdAt: message.createdAt,
  };
}

export function buildLiveChatbotTurn(
  question: string,
  response: ChatbotAnswerResponse,
  timestamp: string,
  sequence: number,
): LiveChatbotTurn {
  return {
    sessionId: response.sessionId,
    userMessage: {
      id: `LIVE-USER-${sequence}`,
      sender: 'USER',
      content: question.trim(),
      citations: [],
      fallback: false,
      createdAt: timestamp,
    },
    assistantMessage: {
      id: `LIVE-BOT-${sequence}`,
      sender: 'ASSISTANT',
      content: response.answer,
      citations: response.citations,
      fallback: response.fallback,
      createdAt: timestamp,
    },
  };
}

function toMessageDedupKey(sender: ChatbotMessageSender, content: string): string {
  return `${sender}:${content.trim()}`;
}

function countMessageKeys(messages: readonly ChatbotDisplayMessage[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of messages) {
    const key = toMessageDedupKey(item.sender, item.content);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function filterUnmatchedLocalMessages(
  localMessages: readonly ChatbotDisplayMessage[],
  serverCounts: Map<string, number>,
): ChatbotDisplayMessage[] {
  const unmatched: ChatbotDisplayMessage[] = [];
  for (const item of localMessages) {
    const key = toMessageDedupKey(item.sender, item.content);
    const remaining = serverCounts.get(key) ?? 0;
    if (remaining > 0) {
      serverCounts.set(key, remaining - 1);
      continue;
    }
    unmatched.push(item);
  }
  return unmatched;
}

export function buildDisplayMessages(
  serverMessages: readonly ChatbotMessageResponse[] | undefined,
  liveTurns: readonly LiveChatbotTurn[],
  activeSessionId: number | null,
  latestFallback: boolean,
): readonly ChatbotDisplayMessage[] {
  const serverList = (serverMessages ?? []).map(fromChatbotMessageResponse);
  const localMessages =
    activeSessionId === null
      ? []
      : liveTurns
          .filter((turn) => turn.sessionId === activeSessionId)
          .flatMap((turn) => [turn.userMessage, turn.assistantMessage]);
  const unmatchedLocal = filterUnmatchedLocalMessages(localMessages, countMessageKeys(serverList));
  const combined = [...serverList, ...unmatchedLocal];
  if (combined.length === 0) {
    return [buildInitialWelcomeMessage()];
  }
  const lastIndex = combined.length - 1;
  const lastMessage = combined[lastIndex];
  if (latestFallback && lastMessage?.sender === 'ASSISTANT' && !lastMessage.fallback) {
    return [...combined.slice(0, lastIndex), { ...lastMessage, fallback: true }];
  }
  return combined;
}
