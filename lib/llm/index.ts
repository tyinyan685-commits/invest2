import "server-only";
import { createDeepSeekProvider } from "./deepseek";
import { createOpenAIProvider } from "./openai";
import type { LlmProvider } from "./types";

export function getLlmProvider(): LlmProvider {
  const provider = process.env.LLM_PROVIDER ?? "deepseek";
  if (provider === "deepseek") return createDeepSeekProvider();
  if (provider === "openai") return createOpenAIProvider();
  throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
}

export * from "./types";
