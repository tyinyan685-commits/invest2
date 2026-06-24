import { z } from "zod";

export const researchOutputSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  rating: z.enum(["buy-research", "hold", "avoid", "needs-checking"]),
  confidence: z.number().min(0).max(100),
  facts: z.array(z.object({ claim: z.string(), sourceIds: z.array(z.string()), strength: z.enum(["strong", "medium", "weak"]) })),
  risks: z.array(z.object({ condition: z.string(), consequence: z.string() })),
  missingEvidence: z.array(z.string()),
});

export type ResearchOutput = z.infer<typeof researchOutputSchema>;

export interface GenerateResearchInput {
  system: string;
  prompt: string;
}

export interface LlmProvider {
  name: "deepseek" | "openai";
  generateResearch(input: GenerateResearchInput): Promise<ResearchOutput>;
}
