import { aiProvider, type ChatMessage } from "../../infrastructure/ai/provider";
import { validationError } from "../../core/errors";

export async function askAI(input: { message: string; history?: ChatMessage[]; context: string }) {
  if (input.message.trim().length < 2 || input.message.length > 4000) throw validationError("AI message must be between 2 and 4000 characters");
  const history = (input.history ?? []).slice(-12);
  return aiProvider.chat([
    { role: "system", content: `You are NEXUS, a safe cybersecurity learning assistant. Focus on education, defense, and authorized testing. Refuse instructions that facilitate unauthorized access. Answer clearly and practically. Platform context: ${input.context}` },
    ...history,
    { role: "user", content: input.message },
  ]);
}

export async function personalizeAI(input: { userName: string; track: string; currentLevel: number; outline: unknown }) {
  return aiProvider.chat([
    { role: "system", content: "Create a practical, safe cybersecurity learning plan using only the supplied curriculum. Do not invent credentials, videos, or offensive techniques. Return concise Markdown." },
    { role: "user", content: `User: ${input.userName}. Track: ${input.track}. Current level: ${input.currentLevel}. Curriculum: ${JSON.stringify(input.outline)}` },
  ]);
}
