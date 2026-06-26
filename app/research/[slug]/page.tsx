import type { Metadata } from "next";
import { Clock3 } from "lucide-react";
import { notFound } from "next/navigation";
import type { ResearchOutput } from "@/lib/llm";
import { createAdminClient } from "@/lib/supabase/admin";
import { ResearchMethodReport } from "@/components/research-method-report";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

async function getReport(slug: string) {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("reports").select("symbol,title,summary,rating,confidence,as_of,content").eq("slug", slug).eq("status", "published").maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const report = await getReport(slug);
  return { title: report?.title ?? "股票研究" };
}

export default async function GeneratedResearchPage({ params }: PageProps) {
  const { slug } = await params;
  const report = await getReport(slug);
  if (!report) notFound();
  const content = report.content as { analysis?: ResearchOutput } | null;
  const analysis = content?.analysis;
  if (!analysis) notFound();
  const ratingLabels = { "buy-research": "优先研究", hold: "继续观察", avoid: "暂时回避", "needs-checking": "待核验" };

  return (
    <main className="generated-report-page">
      <div className="shell generated-report-shell">
        <div className="report-topbar report-topbar-meta"><span><Clock3 size={14} /> {new Date(report.as_of).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</span></div>
        <section className="analysis-result standalone-result">
          <header>
            <div><span className="section-kicker">GENERATED RESEARCH · {report.symbol}</span><h1>{analysis.headline}</h1><p>{analysis.summary}</p></div>
            <aside><span>研究评级</span><strong>{ratingLabels[analysis.rating]}</strong><b>置信度 {Math.round(analysis.confidence)}</b></aside>
          </header>
          <ResearchMethodReport analysis={analysis} />
          {analysis.missingEvidence.length > 0 && <div className="missing-evidence"><h2>仍需核验</h2><ul>{analysis.missingEvidence.map((item) => <li key={item}>{item}</li>)}</ul></div>}
        </section>
      </div>
    </main>
  );
}
