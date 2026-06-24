import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

function enoughChinese(value: unknown) {
  return (JSON.stringify(value).match(/[\u3400-\u9fff]/g) ?? []).length >= 30;
}

export async function generateStagedObject<T>(name: string, schema: z.ZodType<T>, system: string, prompt: string): Promise<T> {
  const provider = process.env.LLM_PROVIDER ?? "deepseek";

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
    const client = new OpenAI({ apiKey });
    const response = await client.responses.parse({
      model: process.env.OPENAI_MODEL ?? "gpt-5.5",
      input: [{ role: "system", content: system }, { role: "user", content: prompt }],
      text: { format: zodTextFormat(schema, name) },
    });
    if (!response.output_parsed) throw new Error(`OpenAI returned no ${name} output`);
    return schema.parse(response.output_parsed);
  }

  if (provider !== "deepseek") throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured");
  const client = new OpenAI({ apiKey, baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com" });
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-pro";
  const jsonSchema = JSON.stringify(z.toJSONSchema(schema));
  let correction = "";
  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await client.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        temperature: 0.15,
        max_tokens: 6_000,
        messages: [
          { role: "system", content: `${system}\n只输出完整 JSON。所有叙述文字使用简体中文；禁止编造快照外事实。` },
          { role: "user", content: `${prompt}\n\n必须严格满足此 JSON Schema：\n${jsonSchema}${correction}` },
        ],
      });
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("DeepSeek returned empty content");
      const parsedJson = JSON.parse(content);
      const validation = schema.safeParse(parsedJson);
      if (!validation.success) {
        const issues = validation.error.issues.slice(0, 16).map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("；");
        correction = `\n\n上一次校验失败。重新输出完整 JSON 并修正：${issues}`;
        throw validation.error;
      }
      if (!enoughChinese(validation.data)) throw new Error("DeepSeek returned insufficient Chinese content");
      return validation.data;
    } catch (error) {
      lastError = error;
      if (!correction) correction = "\n\n上一次输出不完整或格式错误。重新输出全部字段，压缩重复内容但保留分析细节，不得使用 Markdown。";
    }
  }

  throw new Error(`DeepSeek failed at research stage ${name}`, { cause: lastError });
}
