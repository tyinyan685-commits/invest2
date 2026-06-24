import OpenAI from "openai";
import { researchOutputSchema, type GenerateResearchInput, type LlmProvider } from "./types";

const MAX_ATTEMPTS = 3;

function hasEnoughChinese(value: unknown) {
  const text = JSON.stringify(value);
  return (text.match(/[\u3400-\u9fff]/g) ?? []).length >= 80;
}

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
            temperature: 0.2,
            max_tokens: 10_000,
            messages: [
              { role: "system", content: `${input.system}\n所有叙述性字符串必须使用简体中文，只有股票代码、公司名、产品名和来源 ID 可以保留英文。禁止输出英文段落。Return valid JSON matching the requested schema. Do not invent missing facts.` },
              { role: "user", content: input.prompt },
            ],
          });
          const content = response.choices[0]?.message?.content;
          if (!content) throw new Error("DeepSeek returned empty content");
          const parsed = researchOutputSchema.parse(JSON.parse(content));
          if (!hasEnoughChinese(parsed)) throw new Error("DeepSeek returned insufficient Chinese content");
          return parsed;
        } catch (error) {
          lastError = error;
        }
      }
      throw new Error("DeepSeek failed to return a valid research object", { cause: lastError });
    },
  };
}
