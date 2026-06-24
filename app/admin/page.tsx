import type { Metadata } from "next";
import { Database, KeyRound, Sparkles } from "lucide-react";
import { StockAnalyzer } from "@/components/stock-analyzer";

export const metadata: Metadata = { title: "生成研究" };

export default function AdminPage() {
  const configured = Boolean(process.env.DEEPSEEK_API_KEY && process.env.FMP_API_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);

  return (
    <main className="admin-page">
        <div className="shell admin-shell">
        <div className="admin-heading"><span className="eyebrow"><Sparkles size={14} /> PERSONAL RESEARCH DESK</span><h1>查询一只股票</h1><p>输入代码，系统会冻结最新数据，再由七个连续阶段生成一份可续跑的详细研究报告。</p></div>
        <div className="admin-grid analyzer-layout">
          <div><StockAnalyzer configured={configured} /></div>
          <aside className="setup-card">
            <h2>当前研究流程</h2>
            <div><span><Database /></span><p><b>数据冻结</b><small>FMP 财务、行情、历史价格与技术指标。</small></p></div>
            <div><span><KeyRound /></span><p><b>证据约束</b><small>NewsAPI 仅用于新闻发现，结论必须标来源。</small></p></div>
            <div><span><Sparkles /></span><p><b>多角色决策</b><small>四分析师、牛熊辩论、交易与风控、组合经理逐阶段生成。</small></p></div>
            <p className="setup-note">总耗时可以超过单次函数时限；每阶段完成即保存，刷新或中断后可继续。六小时内优先返回已完成报告。</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
