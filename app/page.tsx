import { StockAnalyzer } from "@/components/stock-analyzer";

export default function Home() {
  const configured = Boolean(process.env.DEEPSEEK_API_KEY && process.env.FMP_API_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);

  return (
    <main className="home-research-page">
      <section className="home-search-hero shell" id="stock-search">
        <div className="home-analyzer-shell">
          <StockAnalyzer configured={configured} />
        </div>
      </section>
    </main>
  );
}
