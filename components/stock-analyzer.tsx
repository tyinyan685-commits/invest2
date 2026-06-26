"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, LoaderCircle, Play, RefreshCw, Search } from "lucide-react";
import type { ResearchOutput } from "@/lib/llm";
import { ResearchMethodReport } from "@/components/research-method-report";

type Result = { symbol: string; cached: boolean; slug?: string | null; analysis: ResearchOutput };
type PipelineResponse = Result & { done: boolean; nextStage?: string | null; completedCount?: number; totalStages?: number; error?: string };

const ratingLabels = { "buy-research": "优先研究", hold: "继续观察", avoid: "暂时回避", "needs-checking": "待核验" };
const stageLabels: Record<string, string> = {
  fundamentals: "基本面分析师",
  technical: "市场与技术分析师",
  news: "新闻与宏观分析师",
  sentiment: "情绪分析师",
  debate: "牛熊辩论与研究经理",
  execution: "交易员与风险委员会",
  portfolio: "组合经理最终决策",
};

export function StockAnalyzer({ configured, initialSymbol = "MU", autoRun = false }: { configured: boolean; initialSymbol?: string; autoRun?: boolean }) {
  const normalizedInitialSymbol = initialSymbol.trim().toUpperCase() || "MU";
  const [symbol, setSymbol] = useState(normalizedInitialSymbol);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ stage: string; completed: number; total: number } | null>(null);
  const autoStarted = useRef(false);

  useEffect(() => {
    if (!autoRun || !configured || autoStarted.current) return;
    autoStarted.current = true;
    void runAnalysis(normalizedInitialSymbol);
  }, [autoRun, configured, normalizedInitialSymbol]);

  async function runAnalysis(requestSymbol: string, force = false) {
    const nextSymbol = requestSymbol.trim().toUpperCase();
    if (!nextSymbol) return;
    setSymbol(nextSymbol);
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress({ stage: "正在冻结行情、财务与新闻数据", completed: 0, total: 7 });
    try {
      const startResponse = await fetch("/api/research/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol: nextSymbol, force }) });
      let data = await startResponse.json() as PipelineResponse;
      if (!startResponse.ok) throw new Error(data.error ?? "创建研究任务失败");
      if (data.done) {
        if (data.slug) {
          window.location.assign(`/research/${data.slug}`);
          return;
        }
        setResult(data);
        return;
      }
      if (!data.slug) throw new Error("研究任务没有返回有效编号");

      for (let step = 0; step < 8 && !data.done; step += 1) {
        const stage = data.nextStage ?? "portfolio";
        setProgress({ stage: stageLabels[stage] ?? stage, completed: data.completedCount ?? step, total: data.totalStages ?? 7 });
        const stepResponse = await fetch("/api/research/step", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: data.slug }) });
        data = await stepResponse.json() as PipelineResponse;
        if (!stepResponse.ok) throw new Error(data.error ?? `${stageLabels[stage] ?? stage}阶段失败`);
      }
      if (!data.done) throw new Error("研究流程尚未完成，请再次点击开始分析以续跑。 ");
      setProgress({ stage: "报告已完成", completed: 7, total: 7 });
      if (data.slug) {
        window.location.assign(`/research/${data.slug}`);
        return;
      }
      setResult(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "分析失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  async function analyze(event: FormEvent, force = false) {
    event.preventDefault();
    await runAnalysis(symbol, force);
  }

  return (
    <>
      <form className="generator-card analyzer-form" onSubmit={analyze}>
        <label>股票代码<div className="symbol-input"><Search size={17} /><input value={symbol} onChange={(event) => setSymbol(event.target.value.toUpperCase())} placeholder="例如 MU、NVDA、AAPL" maxLength={12} /></div></label>
        <div className="ticker-examples">快速查询：{["MU", "NVDA", "AAPL", "AMD", "TSLA"].map((ticker) => <button type="button" onClick={() => setSymbol(ticker)} key={ticker}>{ticker}</button>)}</div>
        <button className="button button-primary generate-button" disabled={!configured || loading || !symbol.trim()} type="submit">
          {loading ? <><LoaderCircle className="spin" size={16} /> {progress?.stage ?? "正在生成深度研究"}</> : <><Play size={16} /> 开始深度分析</>}
        </button>
        {loading && progress && <div className="research-progress"><div><span style={{ width: `${Math.max(4, progress.completed / progress.total * 100)}%` }} /></div><p>第 {Math.min(progress.completed + 1, progress.total)} / {progress.total} 阶段 · 每个角色完成后都会保存，可中断后续跑</p></div>}
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
          <button type="button" disabled={loading} onClick={(event) => analyze(event as unknown as FormEvent, true)}><RefreshCw size={14} /> 新建一轮深度分析</button>
          {result.slug && <a href={`/research/${result.slug}`}>打开独立报告 <ArrowUpRight size={14} /></a>}
        </footer>
      </section>}
    </>
  );
}
