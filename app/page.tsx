import { StockAnalyzer } from "@/components/stock-analyzer";

type HomeProps = { searchParams?: Promise<{ symbol?: string; run?: string }> };

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const initialSymbol = params?.symbol?.trim().toUpperCase() || "MU";
  const autoRun = params?.run === "1" && Boolean(params?.symbol?.trim());
  const configured = Boolean(process.env.DEEPSEEK_API_KEY && process.env.FMP_API_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);

  return (
    <main className="home-research-page">
      <section className="home-search-hero shell" id="stock-search">
        <div className="home-analyzer-shell">
          <StockAnalyzer configured={configured} initialSymbol={initialSymbol} autoRun={autoRun} />
          <div className="home-method-card">
            <span>研究方法</span>
            <p>先冻结行情、财务、公告、新闻和实时技术指标，再按多角色流程生成：基本面分析、技术与量价、新闻宏观、情绪、牛熊辩论、交易风控，最后由组合经理给出评级、仓位动作、关键价位和风险触发。</p>
          </div>
        </div>
      </section>
    </main>
  );
}
