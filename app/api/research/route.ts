import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLlmProvider } from "@/lib/llm";
import { buildDecisionReportPrompt } from "@/lib/llm/report-method";
import { getFmpSnapshot } from "@/lib/market-data/fmp";
import { getNewsSnapshot } from "@/lib/market-data/news";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;

const requestSchema = z.object({
  symbol: z.string().trim().toUpperCase().regex(/^[A-Z0-9.\-]{1,12}$/),
  force: z.boolean().optional().default(false),
});

const requestLog = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (requestLog.get(ip) ?? []).filter((time) => now - time < 10 * 60_000);
  if (recent.length >= 5) return true;
  recent.push(now);
  requestLog.set(ip, recent);
  return false;
}

function getCompanyName(profile: unknown): string | null {
  if (!profile || typeof profile !== "object") return null;
  const value = (profile as Record<string, unknown>).companyName;
  return typeof value === "string" ? value : null;
}

async function readCachedReport(symbol: string) {
  try {
    const supabase = createAdminClient();
    const cutoff = new Date(Date.now() - 6 * 60 * 60_000).toISOString();
    const { data } = await supabase.from("reports").select("slug,content,as_of").eq("symbol", symbol).eq("status", "published").gte("as_of", cutoff).order("as_of", { ascending: false }).limit(1).maybeSingle();
    if (!data?.content) return null;
    const content = data.content as { analysis?: { methodologyVersion?: string } };
    if (content.analysis?.methodologyVersion !== "deep-v2") return null;
    return { slug: data.slug, asOf: data.as_of, ...(data.content as Record<string, unknown>) };
  } catch {
    return null;
  }
}

async function saveReport(symbol: string, snapshot: unknown, analysis: { headline: string; summary: string; rating: string; confidence: number }) {
  try {
    const supabase = createAdminClient();
    const timestamp = new Date();
    const slug = `${symbol.toLowerCase()}-${timestamp.toISOString().replace(/[:.]/g, "-").toLowerCase()}`;
    const { error } = await supabase.from("reports").insert({
      slug,
      kind: "decision",
      status: "published",
      symbol,
      market: "US",
      title: analysis.headline,
      summary: analysis.summary,
      rating: analysis.rating,
      confidence: Math.round(analysis.confidence),
      as_of: timestamp.toISOString(),
      published_at: timestamp.toISOString(),
      content: { snapshot, analysis },
    });
    if (error) throw error;
    return slug;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) return NextResponse.json({ error: "请求过于频繁，请十分钟后再试。" }, { status: 429 });

  try {
    const { symbol, force } = requestSchema.parse(await request.json());
    if (!force) {
      const cached = await readCachedReport(symbol);
      if (cached && "analysis" in cached && "snapshot" in cached) return NextResponse.json({ symbol, cached: true, ...cached });
    }

    const fmp = await getFmpSnapshot(symbol);
    if (!fmp.profile && !fmp.quote) return NextResponse.json({ error: `没有找到 ${symbol} 的有效行情或公司资料。` }, { status: 404 });
    const news = await getNewsSnapshot(symbol, getCompanyName(fmp.profile));
    const snapshot = { symbol, asOf: new Date().toISOString(), marketData: fmp, news };
    const provider = getLlmProvider();
    const analysis = await provider.generateResearch({
      system: "你是投资研究流程中的总协调者。你必须先完成四分析师冻结报告，再进行多空辩论、研究经理裁决、交易计划、风险三方压力测试，最后由组合经理作条件化决策。所有事实受输入快照约束，所有正文使用简体中文。",
      prompt: buildDecisionReportPrompt(symbol, snapshot),
    });
    const slug = await saveReport(symbol, snapshot, analysis);
    return NextResponse.json({ symbol, cached: false, slug, snapshot, analysis });
  } catch (error) {
    const message = error instanceof z.ZodError ? "股票代码格式无效。" : error instanceof Error ? error.message : "分析失败，请稍后重试。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
