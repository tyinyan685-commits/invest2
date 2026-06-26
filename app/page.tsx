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
        </div>
      </section>
    </main>
  );
}
