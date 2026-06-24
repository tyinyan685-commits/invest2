import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowUpRight, CheckCircle2, Clock3, Download, Minus, ShieldAlert } from "lucide-react";
import { EvidencePill } from "@/components/evidence-pill";
import { PriceChart } from "@/components/price-chart";
import { decisionReport as report } from "@/lib/data/demo";

export const metadata: Metadata = { title: `${report.symbol} 决策摘要` };

export default function ResearchPage() {
  return (
    <main className="report-page">
      <div className="shell report-shell">
        <div className="report-topbar">
          <Link href="/"><ArrowLeft size={15} /> 返回研究列表</Link>
          <div><span><Clock3 size={14} /> 数据截至 {report.asOf}</span><button type="button"><Download size={15} /> 导出 PDF</button></div>
        </div>

        <header className="report-hero">
          <div className="ticker-lockup"><span>{report.symbol}</span><div><b>{report.company}</b><small>{report.exchange} · {report.date}</small></div></div>
          <div className="report-title-row">
            <div><span className="section-kicker">INVESTMENT DECISION</span><h1>{report.title}</h1><p>{report.summary}</p></div>
            <aside className="rating-card"><span>最终评级</span><strong>{report.rating}</strong><b>{report.ratingEn}</b><div><i style={{ width: `${report.confidence}%` }} /><span>置信度 {report.confidence}</span></div></aside>
          </div>
          <div className="price-ribbon">
            <div><span>价格锚</span><b>{report.price}</b><em>{report.change}</em></div>
            {report.levels.map((level) => <div key={level.label} className={`level-${level.tone}`}><span>{level.label}</span><b>{level.value}</b></div>)}
          </div>
        </header>

        <section className="verdict-grid">
          {report.stance.map(([title, body], index) => (
            <article key={title}><span>{index === 0 ? <Minus /> : index === 1 ? <ShieldAlert /> : <CheckCircle2 />}</span><div><h2>{title}</h2><p>{body}</p></div></article>
          ))}
        </section>

        <section className="report-section chart-section">
          <div className="section-heading compact"><div><span className="section-kicker">PRICE CONTEXT</span><h2>市场已经给了多少预期？</h2></div><span className="data-note">示意趋势 · 正式版接实时数据</span></div>
          <PriceChart />
        </section>

        <section className="report-section">
          <div className="section-heading compact"><div><span className="section-kicker">CORE REASONS</span><h2>为什么现在选择等待</h2></div></div>
          <div className="reason-grid">
            {report.reasons.map((reason, index) => (
              <article className="reason-card" key={reason.title}><span className="reason-number">0{index + 1}</span><EvidencePill strength={reason.evidence} /><h3>{reason.title}</h3><p>{reason.body}</p></article>
            ))}
          </div>
        </section>

        <section className="report-section">
          <div className="section-heading compact"><div><span className="section-kicker">SCENARIO MAP</span><h2>事件落地后的三条路径</h2></div></div>
          <div className="scenario-list">
            {report.scenarios.map((scenario) => (
              <article key={scenario.label}><span className="scenario-label">{scenario.label}</span><div className="scenario-title"><h3>{scenario.title}</h3><b>{scenario.probability}</b></div><p className="scenario-trigger">触发：{scenario.trigger}</p><p>{scenario.action}</p></article>
            ))}
          </div>
        </section>

        <section className="risk-box"><AlertTriangle /><div><span className="section-kicker">WHAT BREAKS THE THESIS</span><h2>什么情况说明判断错了</h2><p>Q4 指引转弱、DRAM 现货价格确认见顶，或财报后收盘跌破 $879。届时应重新检查盈利斜率，而不是只用“股价更便宜”解释下跌。</p></div></section>

        <section className="source-panel">
          <div><span className="section-kicker">DATA LINEAGE</span><h2>数据与证据状态</h2></div>
          <div className="source-stats"><span><b>8</b>关键数据完整</span><span><b>3</b>来源交叉核验</span><span><b>1</b>维度待补充</span></div>
          <button type="button">展开完整来源 <ArrowUpRight size={15} /></button>
        </section>
      </div>
    </main>
  );
}
