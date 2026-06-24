import OpenAI from "openai";
import { researchOutputSchema, type GenerateResearchInput, type LlmProvider } from "./types";

const MAX_ATTEMPTS = 3;

export function createDeepSeekProvider(): LlmProvider {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured");

  const client = new OpenAI({ apiKey, baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com" });
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-pro";

  return {
    name: "deepseek",
    async generateResearch(input: GenerateResearchInput) {
      let lastError: unknown;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        try {
          const response = await client.chat.completions.create({
            model,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: `${input.system}\nReturn valid JSON matching the requested schema. Do not invent missing facts.` },
              { role: "user", content: input.prompt },
            ],
          });
          const content = response.choices[0]?.message?.content;
          if (!content) throw new Error("DeepSeek returned empty content");
          return researchOutputSchema.parse(JSON.parse(content));
        } catch (error) {
          lastError = error;
        }
      }
      throw new Error("DeepSeek failed to return a valid research object", { cause: lastError });
    },
  };
}
