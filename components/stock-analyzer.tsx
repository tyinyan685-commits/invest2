"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, LoaderCircle, Play, RefreshCw, Search } from "lucide-react";
import type { ResearchOutput } from "@/lib/llm";
import { ResearchMethodReport } from "@/components/research-method-report";

type Result = { symbol: string; cached: boolean; slug?: string | null; analysis: ResearchOutput };

const ratingLabels = { "buy-research": "优先研究", hold: "继续观察", avoid: "暂时回避", "needs-checking": "待核验" };

export function StockAnalyzer({ configured }: { configured: boolean }) {
  const [symbol, setSymbol] = useState("MU");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(event: FormEvent, force = false) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol, force }) });
      const data = await response.json() as Result & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "分析失败");
      setResult(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "分析失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form className="generator-card analyzer-form" onSubmit={analyze}>
        <label>股票代码<div className="symbol-input"><Search size={17} /><input value={symbol} onChange={(event) => setSymbol(event.target.value.toUpperCase())} placeholder="例如 MU、NVDA、AAPL" maxLength={12} /></div></label>
        <div className="ticker-examples">快速查询：{["MU", "NVDA", "AAPL", "AMD", "TSLA"].map((ticker) => <button type="button" onClick={() => setSymbol(ticker)} key={ticker}>{ticker}</button>)}</div>
        <button className="button button-primary generate-button" disabled={!configured || loading || !symbol.trim()} type="submit">
          {loading ? <><LoaderCircle className="spin" size={16} /> 正在冻结数据并分析，通常需要 30–90 秒</> : <><Play size={16} /> 开始分析</>}
        </button>
        {!configured && <p className="form-warning"><AlertTriangle size={14} /> Vercel 尚未识别完整的 DeepSeek、FMP 与 Supabase 环境变量。</p>}
        {error && <p className="form-error"><AlertTriangle size={14} /> {error}</p>}
      </form>

      {result && <section className="analysis-result">
        <header>
          <div><span className="section-kicker">{result.cached ? "CACHED RESEARCH" : "NEW RESEARCH"} · {result.symbol}</span><h2>{result.analysis.headline}</h2><p>{result.analysis.summary}</p></div>
          <aside><span>研究评级</span><strong>{ratingLabels[result.analysis.rating]}</strong><b>置信度 {Math.round(result.analysis.confidence)}</b></aside>
        </header>
        <div className="analysis-sections">{result.analysis.sections.map((section) => <article key={section.title}><span><CheckCircle2 size={15} /> {section.title}</span><p>{section.judgment}</p><small>{section.evidenceIds.join(" · ")}</small></article>)}</div>
        <div className="analysis-columns">
          <div><h3>关键事实</h3>{result.analysis.facts.map((fact, index) => <article className="analysis-line" key={`${fact.claim}-${index}`}><b className={`strength-${fact.strength}`}>{fact.strength}</b><p>{fact.claim}<small>{fact.sourceIds.join(" · ")}</small></p></article>)}</div>
          <div><h3>主要风险</h3>{result.analysis.risks.map((risk, index) => <article className="analysis-line risk-line" key={`${risk.condition}-${index}`}><AlertTriangle size={15} /><p><strong>{risk.condition}</strong>{risk.consequence}</p></article>)}</div>
        </div>
        <div className="scenario-cards">{result.analysis.scenarios.map((scenario) => <article key={scenario.name}><span>{scenario.name}</span><b>{scenario.condition}</b><p>{scenario.interpretation}</p></article>)}</div>
        <ResearchMethodReport analysis={result.analysis} />
        <footer>
          <span>{result.cached ? "六小时内缓存结果" : result.slug ? "已保存至研究历史" : "结果已生成，数据库迁移后可保存历史"}</span>
          <button type="button" disabled={loading} onClick={(event) => analyze(event as unknown as FormEvent, true)}><RefreshCw size={14} /> 忽略缓存重新分析</button>
          {result.slug && <a href={`/research/${result.slug}`}>打开独立报告 <ArrowUpRight size={14} /></a>}
        </footer>
      </section>}
    </>
  );
}
