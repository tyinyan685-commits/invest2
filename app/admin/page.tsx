import type { Metadata } from "next";
import { Database, KeyRound, LockKeyhole, Play, Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "生成研究" };

export default function AdminPage() {
  const configured = Boolean(process.env.DEEPSEEK_API_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);

  return (
    <main className="admin-page">
      <div className="shell admin-shell">
        <div className="admin-heading"><span className="eyebrow"><Sparkles size={14} /> RESEARCH WORKBENCH</span><h1>生成一份新研究</h1><p>先冻结数据，再启动分析。正式生成入口会在 Supabase 登录和服务端密钥配置完成后开放。</p></div>
        <div className="admin-grid">
          <section className="generator-card">
            <label>股票代码<input defaultValue="MU" placeholder="例如 MU、NVDA、AAPL" /></label>
            <div className="form-row"><label>报告类型<select defaultValue="decision"><option value="decision">决策摘要</option><option value="deep">深度研究</option><option value="challenge">论点压力测试</option></select></label><label>市场<select defaultValue="US"><option value="US">美股</option><option value="HK">港股</option><option value="CN">A 股</option></select></label></div>
            <label>特别关注<textarea placeholder="例如：重点检查 HBM 周期、财报缺口风险和前瞻估值" rows={4} /></label>
            <button className="button button-primary generate-button" disabled type="button"><Play size={16} /> {configured ? "研究引擎接入中" : "等待环境配置"}</button>
          </section>
          <aside className="setup-card">
            <h2>上线前还差两步</h2>
            <div><span><Database /></span><p><b>连接 Supabase</b><small>填写 Project URL、Publishable Key 和服务端 Secret Key。</small></p></div>
            <div><span><KeyRound /></span><p><b>连接模型</b><small>首版使用 DeepSeek，OpenAI 保留为空即可。</small></p></div>
            <div><span><LockKeyhole /></span><p><b>创建管理员</b><small>关闭公开注册，只允许指定邮箱登录工作台。</small></p></div>
            <p className="setup-note">所有供应商密钥仅在服务端读取，不会进入浏览器构建产物。</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
