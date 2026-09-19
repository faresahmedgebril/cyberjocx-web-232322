import { ENV } from "../../config/env";
import { externalServiceError } from "../../core/errors";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type ChatResult = { content: string; model: string; inputTokens?: number; outputTokens?: number; totalTokens?: number };

export interface AIProvider {
  chat(messages: ChatMessage[], options?: { maxTokens?: number; model?: string }): Promise<ChatResult>;
}

export class OpenAICompatibleProvider implements AIProvider {
  async chat(messages: ChatMessage[], options: { maxTokens?: number; model?: string } = {}) {
    if (!ENV.AI_API_KEY) throw externalServiceError("AI provider is not configured");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ENV.AI_TIMEOUT_MS);
    try {
      const response = await fetch(`${ENV.AI_BASE_URL.replace(/\/$/, "")}/chat/completions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${ENV.AI_API_KEY}` }, body: JSON.stringify({ model: options.model ?? ENV.AI_MODEL, messages, max_tokens: options.maxTokens ?? ENV.AI_MAX_TOKENS }), signal: controller.signal });
      if (!response.ok) throw externalServiceError(`AI provider returned ${response.status}`);
      const payload = await response.json() as { model?: string; choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } };
      const content = payload.choices?.[0]?.message?.content;
      if (typeof content !== "string") throw externalServiceError("AI provider returned no text");
      return { content, model: payload.model ?? options.model ?? ENV.AI_MODEL, inputTokens: payload.usage?.prompt_tokens, outputTokens: payload.usage?.completion_tokens, totalTokens: payload.usage?.total_tokens };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw externalServiceError("AI provider timed out", error);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const aiProvider: AIProvider = new OpenAICompatibleProvider();
