import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nextResearchStage, type StoredStages } from "@/lib/llm/staged-research";
import { getFmpSnapshot } from "@/lib/market-data/fmp";
import { getNewsSnapshot } from "@/lib/market-data/news";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 180;

const requestSchema = z.object({
  symbol: z.string().trim().toUpperCase().regex(/^[A-Z0-9.\-]{1,12}$/),
  force: z.boolean().optional().default(false),
  sourceSlug: z.string().min(8).max(160).optional(),
  restartFrom: z.enum(["debate", "execution", "portfolio"]).optional(),
});

function companyName(profile: unknown) {
  if (!profile || typeof profile !== "object") return null;
  const value = (profile as Record<string, unknown>).companyName;
  return typeof value === "string" ? value : null;
}

export async function POST(request: NextRequest) {
  try {
    const { symbol, force, sourceSlug, restartFrom } = requestSchema.parse(await request.json());
    const supabase = createAdminClient();
    const cutoff = new Date(Date.now() - 6 * 60 * 60_000).toISOString();

    if (force && sourceSlug && restartFrom) {
      const { data: source, error: sourceError } = await supabase.from("reports").select("symbol,content").eq("slug", sourceSlug).eq("status", "published").maybeSingle();
      if (sourceError) throw sourceError;
      const sourceContent = source?.content as { pipelineVersion?: string; snapshot?: unknown; stages?: StoredStages } | undefined;
      if (!source || source.symbol !== symbol || sourceContent?.pipelineVersion !== "staged-v1" || !sourceContent.snapshot || !sourceContent.stages) return NextResponse.json({ error: "没有找到可用于修订的完整研究报告。" }, { status: 404 });
      const keepUntil = { debate: 4, execution: 5, portfolio: 6 }[restartFrom];
      const keptStages = Object.fromEntries(Object.entries(sourceContent.stages).filter(([name]) => ["fundamentals", "technical", "news", "sentiment", "debate", "execution"].indexOf(name) < keepUntil));
      const timestamp = new Date();
      const slug = `${symbol.toLowerCase()}-deep-${timestamp.toISOString().replace(/[:.]/g, "-").toLowerCase()}`;
      const { error } = await supabase.from("reports").insert({
        slug, kind: "deep", status: "running", symbol, market: "US", title: `${symbol} 深度研究修订中`, summary: `从${restartFrom}阶段重新生成。`, as_of: (sourceContent.snapshot as { asOf?: string }).asOf ?? timestamp.toISOString(), content: { pipelineVersion: "staged-v1", snapshot: sourceContent.snapshot, stages: keptStages },
      });
      if (error) throw error;
      return NextResponse.json({ symbol, cached: false, done: false, slug, nextStage: restartFrom });
    }

    if (!force) {
      const { data: cached } = await supabase.from("reports").select("slug,content,as_of").eq("symbol", symbol).eq("status", "published").gte("as_of", cutoff).order("as_of", { ascending: false }).limit(1).maybeSingle();
      const cachedContent = cached?.content as { analysis?: { methodologyVersion?: string }; snapshot?: unknown } | undefined;
      if (cached && cachedContent?.analysis?.methodologyVersion === "deep-v2") {
        return NextResponse.json({ symbol, cached: true, done: true, slug: cached.slug, asOf: cached.as_of, ...cachedContent });
      }

      const resumeCutoff = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
      const { data: running } = await supabase.from("reports").select("slug,content").eq("symbol", symbol).eq("status", "running").gte("created_at", resumeCutoff).order("created_at", { ascending: false }).limit(1).maybeSingle();
      const runningContent = running?.content as { pipelineVersion?: string; stages?: StoredStages } | undefined;
      if (running && runningContent?.pipelineVersion === "staged-v1") {
        return NextResponse.json({ symbol, cached: false, done: false, slug: running.slug, nextStage: nextResearchStage(runningContent.stages ?? {}) });
      }
    }

    const marketData = await getFmpSnapshot(symbol);
    if (!marketData.profile && !marketData.quote) return NextResponse.json({ error: `没有找到 ${symbol} 的有效行情或公司资料。` }, { status: 404 });
    const news = await getNewsSnapshot(symbol, companyName(marketData.profile));
    const snapshot = { symbol, asOf: new Date().toISOString(), marketData, news };
    const timestamp = new Date();
    const slug = `${symbol.toLowerCase()}-deep-${timestamp.toISOString().replace(/[:.]/g, "-").toLowerCase()}`;
    const content = { pipelineVersion: "staged-v1", snapshot, stages: {} };
    const { error } = await supabase.from("reports").insert({
      slug,
      kind: "deep",
      status: "running",
      symbol,
      market: "US",
      title: `${symbol} 深度研究生成中`,
      summary: "多角色研究流程正在运行。",
      as_of: snapshot.asOf,
      content,
    });
    if (error) throw error;
    return NextResponse.json({ symbol, cached: false, done: false, slug, nextStage: "fundamentals" });
  } catch (error) {
    const message = error instanceof z.ZodError ? "股票代码格式无效。" : error instanceof Error ? error.message : "创建研究任务失败。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
