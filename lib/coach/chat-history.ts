/** Limite l'historique envoyé au modèle (coût + fenêtre de contexte). */
export function trimChatHistoryForModel<T extends { role: string; content: string }>(
  messages: T[],
  options?: { maxMessages?: number; maxCharsPerMessage?: number }
): T[] {
  const maxMessages = options?.maxMessages ?? 24;
  const maxChars = options?.maxCharsPerMessage ?? 2800;

  return messages.slice(-maxMessages).map((message) => {
    const content = message.content.trim();
    if (content.length <= maxChars) return { ...message, content };
    return {
      ...message,
      content: `${content.slice(0, maxChars)}… [message tronqué pour le contexte]`,
    };
  });
}
