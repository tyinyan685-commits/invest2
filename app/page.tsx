import { BarChart3, FileSearch, ShieldCheck, Sparkles } from "lucide-react";
import { StockAnalyzer } from "@/components/stock-analyzer";

export default function Home() {
  const configured = Boolean(process.env.DEEPSEEK_API_KEY && process.env.FMP_API_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);

  return (
    <main className="home-research-page">
      <section className="home-search-hero shell" id="stock-search">
        <div className="home-search-heading">
          <div className="eyebrow"><span className="live-dot" /> PERSONAL STOCK RESEARCH</div>
          <h1>输入股票代码，生成一份可执行的个股研究报告。</h1>
          <p>先把个股研究做好：行情、财务、公告、新闻和实时技术状态会被冻结为同一份快照，再按你 MU 报告里的多角色框架输出结论、仓位动作、关键价位和风险触发。</p>
        </div>
        <div className="home-analyzer-shell">
          <StockAnalyzer configured={configured} />
        </div>
      </section>

      <section className="method-strip compact-method-strip">
        <div className="shell method-grid">
          <div className="method-intro"><span className="section-kicker">HOW IT WORKS</span><h2>先服务一件事：个股研究。</h2><p>市场扫描先放一边；首页只保留股票查询和报告生成。</p></div>
          <div className="method-item"><FileSearch /><b>冻结事实</b><span>先锁定基准时间和原始数据</span></div>
          <div className="method-item"><BarChart3 /><b>代码计算</b><span>指标与估值不交给模型心算</span></div>
          <div className="method-item"><ShieldCheck /><b>交叉核验</b><span>结论必须能回到来源与证据</span></div>
          <div className="method-item"><Sparkles /><b>分阶段生成</b><span>可中断、可续跑、可强制刷新</span></div>
        </div>
      </section>
    </main>
  );
}
