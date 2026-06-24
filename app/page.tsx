import Link from "next/link";
import { ArrowRight, BarChart3, Clock3, FileSearch, ShieldCheck, Sparkles } from "lucide-react";
import { latestResearch } from "@/lib/data/demo";

export default function Home() {
  return (
    <main>
      <section className="hero shell">
        <div className="eyebrow"><span className="live-dot" /> 研究系统在线 · 美股</div>
        <div className="hero-grid">
          <div>
            <h1>把市场噪声，<br /><em>压缩成可验证的判断。</em></h1>
            <p className="hero-copy">从行情、财报、公告和新闻中冻结事实，再让多空观点接受同一组证据的约束。先看结论，需要时再展开过程。</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/research/mu-2026-06-24">查看 MU 决策摘要 <ArrowRight size={17} /></Link>
              <Link className="button button-ghost" href="/admin"><Sparkles size={16} /> 生成新研究</Link>
            </div>
          </div>
          <aside className="market-pulse">
            <div className="pulse-head"><span>今日研究脉搏</span><span className="status-chip">AS OF 06/24</span></div>
            <div className="pulse-main"><small>核心判断</small><strong>内存上行周期未完，<br />但短期赔率已经变差。</strong></div>
            <div className="pulse-stats">
              <div><span>研究覆盖</span><b>23</b><small>候选标的</small></div>
              <div><span>强证据</span><b>71%</b><small>结论占比</small></div>
              <div><span>主要风险</span><b>财报</b><small>二元事件</small></div>
            </div>
          </aside>
        </div>
      </section>

      <section className="shell section-block">
        <div className="section-heading">
          <div><span className="section-kicker">LATEST RESEARCH</span><h2>最新研究</h2></div>
          <Link href="/market/2026-06-16">查看市场扫描 <ArrowRight size={15} /></Link>
        </div>
        <div className="research-list">
          {latestResearch.map((item, index) => (
            <Link className="research-row" href={item.href} key={`${item.title}-${index}`}>
              <div className="row-index">0{index + 1}</div>
              <div className="row-main"><span className="row-kind">{item.kind}</span><h3>{item.title}</h3><p>{item.excerpt}</p></div>
              <div className="row-symbol"><span>{item.symbol}</span><b>{item.rating}</b></div>
              <div className="row-date">{item.date}<ArrowRight size={17} /></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="method-strip">
        <div className="shell method-grid">
          <div className="method-intro"><span className="section-kicker">HOW IT WORKS</span><h2>不是一个会写报告的聊天框。</h2><p>它是一条保留数据快照、证据等级和反方条件的研究流水线。</p></div>
          <div className="method-item"><FileSearch /><b>冻结事实</b><span>先锁定基准时间和原始数据</span></div>
          <div className="method-item"><BarChart3 /><b>代码计算</b><span>指标与估值不交给模型心算</span></div>
          <div className="method-item"><ShieldCheck /><b>交叉核验</b><span>结论必须能回到来源与证据</span></div>
          <div className="method-item"><Clock3 /><b>保留版本</b><span>新报告不会覆盖旧判断</span></div>
        </div>
      </section>
    </main>
  );
}
