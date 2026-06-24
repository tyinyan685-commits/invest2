import { z } from "zod";

export const researchOutputSchema = z.object({
  methodologyVersion: z.literal("deep-v2"),
  headline: z.string(),
  summary: z.string(),
  rating: z.enum(["buy-research", "hold", "avoid", "needs-checking"]),
  confidence: z.number().min(0).max(100),
  facts: z.array(z.object({ claim: z.string(), sourceIds: z.array(z.string()), strength: z.enum(["strong", "medium", "weak"]) })),
  sections: z.array(z.object({ title: z.string(), judgment: z.string(), evidenceIds: z.array(z.string()) })),
  scenarios: z.array(z.object({ name: z.string(), condition: z.string(), interpretation: z.string() })),
  risks: z.array(z.object({ condition: z.string(), consequence: z.string() })),
  missingEvidence: z.array(z.string()),
  executiveSummary: z.object({
    oneSentence: z.string(),
    positionAction: z.string(),
    coreReasons: z.array(z.object({ point: z.string(), evidenceIds: z.array(z.string()), strength: z.enum(["strong", "medium", "weak"]) })).min(3).max(5),
    riskTriggers: z.array(z.object({ condition: z.string(), response: z.string(), severity: z.enum(["high", "medium", "low"]) })).min(3).max(6),
  }),
  analysts: z.object({
    fundamentals: z.object({ judgment: z.string(), quality: z.string(), earningsTrend: z.string(), valuation: z.string(), estimates: z.string(), cashFlowAndBalanceSheet: z.string(), evidenceIds: z.array(z.string()), mainRisk: z.string() }),
    technical: z.object({ judgment: z.string(), trend: z.string(), momentum: z.string(), volatility: z.string(), volumePrice: z.string(), keyLevels: z.array(z.object({ label: z.string(), price: z.number().nullable(), meaning: z.string() })), evidenceIds: z.array(z.string()) }),
    news: z.object({ judgment: z.string(), companyEvents: z.array(z.string()), macroEvents: z.array(z.string()), nextCatalysts: z.array(z.string()), evidenceIds: z.array(z.string()), limitations: z.string() }),
    sentiment: z.object({ direction: z.string(), crowding: z.string(), evidenceStrength: z.enum(["strong", "medium", "weak", "needs-checking"]), observations: z.array(z.string()), limitations: z.string() }),
  }),
  debate: z.object({
    bull: z.object({ arguments: z.array(z.object({ point: z.string(), strength: z.enum(["strong", "medium", "weak"]), evidenceIds: z.array(z.string()) })).min(3), weakestPoint: z.string() }),
    bear: z.object({ arguments: z.array(z.object({ point: z.string(), strength: z.enum(["strong", "medium", "weak"]), evidenceIds: z.array(z.string()) })).min(3), strongestCounterpoint: z.string() }),
    managerVerdict: z.object({ verdict: z.string(), acceptedBull: z.string(), discountedBull: z.string(), acceptedBear: z.string(), decisionLogic: z.string() }),
  }),
  riskPanel: z.object({
    aggressive: z.object({ position: z.string(), rationale: z.string(), cost: z.string() }),
    neutral: z.object({ position: z.string(), rationale: z.string(), calibration: z.string() }),
    conservative: z.object({ position: z.string(), worstCase: z.string(), protection: z.string() }),
  }),
  tradePlan: z.object({
    posture: z.string(),
    currentAction: z.string(),
    entrySteps: z.array(z.object({ condition: z.string(), action: z.string(), allocationPct: z.number().min(0).max(100).nullable(), priceLevel: z.number().nullable() })).max(5),
    reduceSteps: z.array(z.object({ condition: z.string(), action: z.string(), priceLevel: z.number().nullable() })).max(5),
    eventRules: z.array(z.string()),
    upsideReferences: z.array(z.number()),
    downsideReferences: z.array(z.number()),
    invalidation: z.string(),
    riskReward: z.string(),
  }),
  portfolioManager: z.object({
    finalRating: z.enum(["BUY", "HOLD", "SELL", "WATCH"]),
    ratingReason: z.string(),
    targetPosition: z.string(),
    actionSummary: z.string(),
    eventStance: z.string(),
    priceFramework: z.string(),
    topRisks: z.array(z.string()).min(3).max(6),
  }),
  dataStatus: z.array(z.object({ category: z.string(), source: z.string(), status: z.enum(["success", "degraded", "missing"]), notes: z.string() })),
  nextChecks: z.array(z.string()),
});

export const fundamentalStageSchema = researchOutputSchema.shape.analysts.shape.fundamentals;
export const technicalStageSchema = researchOutputSchema.shape.analysts.shape.technical;
export const newsStageSchema = researchOutputSchema.shape.analysts.shape.news;
export const sentimentStageSchema = researchOutputSchema.shape.analysts.shape.sentiment;
export const debateStageSchema = researchOutputSchema.shape.debate;
export const executionStageSchema = z.object({
  riskPanel: researchOutputSchema.shape.riskPanel,
  tradePlan: researchOutputSchema.shape.tradePlan,
});
export const portfolioStageSchema = researchOutputSchema.pick({
  headline: true,
  summary: true,
  rating: true,
  confidence: true,
  facts: true,
  sections: true,
  scenarios: true,
  risks: true,
  missingEvidence: true,
  executiveSummary: true,
  portfolioManager: true,
  dataStatus: true,
  nextChecks: true,
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
