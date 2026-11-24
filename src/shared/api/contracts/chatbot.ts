import { z } from 'zod';
import { createPageResponseSchema, IsoTimestampSchema, PositiveIdSchema } from './common';

export const CHATBOT_MESSAGE_SENDERS = ['USER', 'ASSISTANT'] as const;
export type ChatbotMessageSender = (typeof CHATBOT_MESSAGE_SENDERS)[number];

export const ChatbotCitationResponseSchema = z.object({
  articleId: PositiveIdSchema,
  title: z.string().min(1),
});
export type ChatbotCitationResponse = z.infer<typeof ChatbotCitationResponseSchema>;

export const AskChatbotQuestionRequestSchema = z.object({
  question: z.string().trim().min(5).max(1000),
  sessionId: PositiveIdSchema.nullable().optional(),
});
export type AskChatbotQuestionRequest = z.infer<typeof AskChatbotQuestionRequestSchema>;

export const ChatbotAnswerResponseSchema = z.object({
  sessionId: PositiveIdSchema,
  answer: z.string(),
  citations: z.array(ChatbotCitationResponseSchema),
  fallback: z.boolean(),
});
export type ChatbotAnswerResponse = z.infer<typeof ChatbotAnswerResponseSchema>;

export const ChatbotMessageResponseSchema = z.object({
  id: PositiveIdSchema,
  sender: z.enum(CHATBOT_MESSAGE_SENDERS),
  content: z.string(),
  citations: z.array(ChatbotCitationResponseSchema),
  createdAt: IsoTimestampSchema,
});
export type ChatbotMessageResponse = z.infer<typeof ChatbotMessageResponseSchema>;

export const ChatbotMessagePageSchema = createPageResponseSchema(ChatbotMessageResponseSchema);

export const ChatbotMessagesParamsSchema = z.object({
  page: z.number().int().nonnegative().optional(),
  size: z.number().int().min(1).max(100).optional(),
});
export type ChatbotMessagesParams = z.infer<typeof ChatbotMessagesParamsSchema>;
