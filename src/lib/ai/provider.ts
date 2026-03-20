import OpenAI from "openai";
import { env } from "@/lib/env";

export const aiClient =
  env.OPENAI_API_KEY && env.OPENAI_API_KEY.length > 0
    ? new OpenAI({
        baseURL: env.OPENAI_API_BASE_URL,
        apiKey: env.OPENAI_API_KEY,
      })
    : null;

export async function createEmbedding(text: string): Promise<number[]> {
  if (!aiClient) {
    // Deterministic local fallback to keep the app functional in demo mode.
    const values = new Array<number>(24).fill(0);
    for (let i = 0; i < text.length; i += 1) {
      values[i % values.length] += text.charCodeAt(i) / 1000;
    }
    return values;
  }

  const response = await aiClient.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 6000),
  });
  return response.data[0]?.embedding ?? [];
}

export async function askModel(systemPrompt: string, userPrompt: string) {
  if (!aiClient) {
    return `Demo-mode answer: ${userPrompt}`;
  }

  const response = await aiClient.responses.create({
    model: env.OPENAI_MODEL,
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return response.output_text;
}
