import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { researchOutputSchema, type GenerateResearchInput, type LlmProvider } from "./types";

export function createOpenAIProvider(): LlmProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? "gpt-5.5";

  return {
    name: "openai",
    async generateResearch(input: GenerateResearchInput) {
      const response = await client.responses.parse({
        model,
        input: [
          { role: "system", content: input.system },
          { role: "user", content: input.prompt },
        ],
        text: { format: zodTextFormat(researchOutputSchema, "research_output") },
      });
      if (!response.output_parsed) throw new Error("OpenAI returned no structured research output");
      return response.output_parsed;
    },
  };
}
