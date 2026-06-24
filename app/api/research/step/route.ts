import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assembleResearchOutput, nextResearchStage, researchStageOrder, runResearchStage, type StoredStages } from "@/lib/llm/staged-research";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;

const requestSchema = z.object({ slug: z.string().min(8).max(160) });

export async function POST(request: NextRequest) {
  try {
    const { slug } = requestSchema.parse(await request.json());
    const supabase = createAdminClient();
    const { data: report, error: readError } = await supabase.from("reports").select("id,slug,symbol,status,content").eq("slug", slug).maybeSingle();
    if (readError) throw readError;
    if (!report) return NextResponse.json({ error: "研究任务不存在。" }, { status: 404 });
    const content = report.content as { pipelineVersion?: string; snapshot?: unknown; stages?: StoredStages; analysis?: unknown };
    if (report.status === "published" && content.analysis) return NextResponse.json({ done: true, slug, symbol: report.symbol, cached: true, snapshot: content.snapshot, analysis: content.analysis });
    if (report.status !== "running" || content.pipelineVersion !== "staged-v1" || !content.snapshot) return NextResponse.json({ error: "研究任务状态无效。" }, { status: 409 });

    const stages = content.stages ?? {};
    const stage = nextResearchStage(stages);
    if (!stage) return NextResponse.json({ error: "研究阶段记录不完整。" }, { status: 409 });
    const output = await runResearchStage(stage, report.symbol, content.snapshot, stages);
    const nextStages = { ...stages, [stage]: output };
    const nextStage = nextResearchStage(nextStages);

    if (nextStage) {
      const { error: updateError } = await supabase.from("reports").update({ content: { ...content, stages: nextStages }, updated_at: new Date().toISOString() }).eq("id", report.id);
      if (updateError) throw updateError;
      return NextResponse.json({ done: false, slug, symbol: report.symbol, completedStage: stage, nextStage, completedCount: researchStageOrder.indexOf(stage) + 1, totalStages: researchStageOrder.length });
    }

    const analysis = assembleResearchOutput(nextStages);
    const finishedAt = new Date().toISOString();
    const finalContent = { pipelineVersion: "staged-v1", snapshot: content.snapshot, stages: nextStages, analysis };
    const { error: publishError } = await supabase.from("reports").update({
      status: "published",
      kind: "deep",
      title: analysis.headline,
      summary: analysis.summary,
      rating: analysis.rating,
      confidence: Math.round(analysis.confidence),
      published_at: finishedAt,
      updated_at: finishedAt,
      content: finalContent,
    }).eq("id", report.id);
    if (publishError) throw publishError;
    return NextResponse.json({ done: true, slug, symbol: report.symbol, cached: false, snapshot: content.snapshot, analysis });
  } catch (error) {
    const message = error instanceof z.ZodError ? "研究任务参数无效。" : error instanceof Error ? error.message : "研究阶段失败。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
