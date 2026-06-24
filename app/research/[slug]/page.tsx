import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3 } from "lucide-react";
import { notFound } from "next/navigation";
import type { ResearchOutput } from "@/lib/llm";
import { createAdminClient } from "@/lib/supabase/admin";

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
        <div className="report-topbar"><Link href="/admin"><ArrowLeft size={15} /> 查询其他股票</Link><span><Clock3 size={14} /> {new Date(report.as_of).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</span></div>
        <section className="analysis-result standalone-result">
          <header>
            <div><span className="section-kicker">GENERATED RESEARCH · {report.symbol}</span><h1>{analysis.headline}</h1><p>{analysis.summary}</p></div>
            <aside><span>研究评级</span><strong>{ratingLabels[analysis.rating]}</strong><b>置信度 {Math.round(analysis.confidence)}</b></aside>
          </header>
          <div className="analysis-sections">{analysis.sections.map((section) => <article key={section.title}><span><CheckCircle2 size={15} /> {section.title}</span><p>{section.judgment}</p><small>{section.evidenceIds.join(" · ")}</small></article>)}</div>
          <div className="analysis-columns">
            <div><h2>关键事实</h2>{analysis.facts.map((fact, index) => <article className="analysis-line" key={`${fact.claim}-${index}`}><b className={`strength-${fact.strength}`}>{fact.strength}</b><p>{fact.claim}<small>{fact.sourceIds.join(" · ")}</small></p></article>)}</div>
            <div><h2>主要风险</h2>{analysis.risks.map((risk, index) => <article className="analysis-line risk-line" key={`${risk.condition}-${index}`}><AlertTriangle size={15} /><p><strong>{risk.condition}</strong>{risk.consequence}</p></article>)}</div>
          </div>
          <div className="scenario-cards">{analysis.scenarios.map((scenario) => <article key={scenario.name}><span>{scenario.name}</span><b>{scenario.condition}</b><p>{scenario.interpretation}</p></article>)}</div>
          {analysis.missingEvidence.length > 0 && <div className="missing-evidence"><h2>仍需核验</h2><ul>{analysis.missingEvidence.map((item) => <li key={item}>{item}</li>)}</ul></div>}
        </section>
      </div>
    </main>
  );
}
