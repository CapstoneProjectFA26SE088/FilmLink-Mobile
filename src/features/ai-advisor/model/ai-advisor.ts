import { type AiChatMessage, buildAiAdvisoryReply } from '@/shared/domain';

export type AdvisorMode = 'chat' | 'diagnostics';

export function appendAdvisoryTurn(
  history: readonly AiChatMessage[],
  prompt: string,
): readonly AiChatMessage[] {
  const query = prompt.trim();
  if (!query) {
    return history;
  }
  const userMessage: AiChatMessage = {
    id: `USR-${Date.now()}`,
    sender: 'USER',
    text: query,
    timestamp: new Date().toISOString(),
  };
  return [...history, userMessage, buildAiAdvisoryReply(query)];
}
