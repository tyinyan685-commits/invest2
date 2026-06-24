import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CircleAlert, Radar, TrendingUp } from "lucide-react";
import { marketCandidates } from "@/lib/data/demo";

export const metadata: Metadata = { title: "市场机会扫描 2026-06-16" };

export default function MarketScanPage() {
  return (
    <main className="market-page">
      <div className="shell market-shell">
        <Link className="back-link" href="/"><ArrowLeft size={15} /> 返回研究列表</Link>
        <header className="market-hero">
          <div><span className="eyebrow"><Radar size={14} /> MARKET SCAN · DEEP</span><h1>AI 内存超周期<br /><em>进入拥挤区</em></h1><p>全市场 risk-on 抬高了“深回撤价值”评分，而真正的硬催化集中在少数事件型标的。先修正机械评分，再排研究优先级。</p></div>
          <aside><span>市场宽度</span><strong>10 / 11</strong><small>板块上涨</small><div><i style={{ width: "91%" }} /></div><b><TrendingUp size={15} /> Risk-on</b></aside>
        </header>

        <section className="market-thesis">
          <CircleAlert size={20} />
          <div><span>本轮最重要的判断</span><p>PATH、SNAP、SOFI 的 value 得分受普涨加成影响，不能把“跌得多”直接解释成安全边际；PAYO 与 MRVL 虽未进入机械 Top 5，反而拥有更可验证的事件催化。</p></div>
        </section>

        <section className="candidate-section">
          <div className="section-heading compact"><div><span className="section-kicker">RESEARCH PRIORITY</span><h2>Top 5 优先研究名单</h2></div><span className="data-note">基准：2026-06-15 收盘</span></div>
          <div className="candidate-table">
            <div className="candidate-head"><span>#</span><span>标的</span><span>综合分</span><span>主要信号</span><span>为什么还不能下结论</span><span /></div>
            {marketCandidates.map((candidate) => (
              <article key={candidate.symbol}>
                <span className="candidate-rank">0{candidate.rank}</span>
                <strong>{candidate.symbol}</strong>
                <div className="score-cell"><b>{candidate.score.toFixed(2)}</b><i><em style={{ width: `${candidate.score * 10}%` }} /></i></div>
                <span>{candidate.signal}</span>
                <p>{candidate.caveat}</p>
                <Link href={candidate.symbol === "PATH" ? "/admin" : "/research/mu-2026-06-24"} aria-label={`研究 ${candidate.symbol}`}><ArrowUpRight size={17} /></Link>
              </article>
            ))}
          </div>
        </section>

        <section className="watch-grid">
          <article><span>硬催化候补</span><h3>PAYO</h3><p>确认的全现金并购，价差约 5.3%。综合分被“上涨空间封顶”压低，不代表事件质量差。</p></article>
          <article><span>主线候补</span><h3>MRVL</h3><p>高位导致 value 低分，但产业催化比多数深回撤标的更清晰，值得单独深挖。</p></article>
          <article className="watch-risk"><span>拥挤风险</span><h3>MU · SNDK · WDC</h3><p>内存主线最强，也最拥挤。继续上涨需要盈利预期再次上修，而不只是叙事延续。</p></article>
        </section>
      </div>
    </main>
  );
}
