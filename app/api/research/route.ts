import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLlmProvider } from "@/lib/llm";
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
      system: "你是严谨的股票研究员。只允许使用输入快照中的事实。区分事实与解释，不给保证收益，不使用直接买卖指令。数值缺失时明确写待核验。用简洁自然的中文输出。",
      prompt: `请分析 ${symbol}。以下是冻结的数据快照：\n${JSON.stringify(snapshot)}\n\n输出一个 JSON 对象，必须严格包含这些字段：headline(string), summary(string), rating(buy-research|hold|avoid|needs-checking), confidence(0-100 number), facts([{claim,sourceIds,strength(strong|medium|weak)}]), sections([{title,judgment,evidenceIds}])，sections 至少覆盖基本面、估值、技术面、新闻与事件，scenarios([{name,condition,interpretation}])且包含乐观/基准/悲观三种，risks([{condition,consequence}]), missingEvidence([string])。sourceIds 使用 fmp:quote、fmp:profile、fmp:financials、fmp:technicals 或 news:N。所有结论必须能追溯到这些 sourceIds。`,
    });
    const slug = await saveReport(symbol, snapshot, analysis);
    return NextResponse.json({ symbol, cached: false, slug, snapshot, analysis });
  } catch (error) {
    const message = error instanceof z.ZodError ? "股票代码格式无效。" : error instanceof Error ? error.message : "分析失败，请稍后重试。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
