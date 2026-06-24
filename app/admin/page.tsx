import type { Metadata } from "next";
import { Database, KeyRound, Sparkles } from "lucide-react";
import { StockAnalyzer } from "@/components/stock-analyzer";

export const metadata: Metadata = { title: "生成研究" };

export default function AdminPage() {
  const configured = Boolean(process.env.DEEPSEEK_API_KEY && process.env.FMP_API_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);

  return (
    <main className="admin-page">
      <div className="shell admin-shell">
        <div className="admin-heading"><span className="eyebrow"><Sparkles size={14} /> PERSONAL RESEARCH DESK</span><h1>查询一只股票</h1><p>输入代码，系统会冻结最新行情、财务与新闻，再生成一份有来源约束的分析。</p></div>
        <div className="admin-grid analyzer-layout">
          <div><StockAnalyzer configured={configured} /></div>
          <aside className="setup-card">
            <h2>当前研究流程</h2>
            <div><span><Database /></span><p><b>数据冻结</b><small>FMP 财务、行情、历史价格与技术指标。</small></p></div>
            <div><span><KeyRound /></span><p><b>证据约束</b><small>NewsAPI 仅用于新闻发现，结论必须标来源。</small></p></div>
            <div><span><Sparkles /></span><p><b>模型判断</b><small>DeepSeek 生成结构化分析，OpenAI 接口保留。</small></p></div>
            <p className="setup-note">同一股票六小时内优先返回缓存。所有 API Key 仅在 Vercel 服务端使用。</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
