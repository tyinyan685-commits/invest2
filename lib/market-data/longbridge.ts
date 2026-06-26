import "server-only";

type SessionQuote = {
  lastDone: number | null;
  timestamp: string | null;
  volume: number | null;
  turnover: number | null;
  high: number | null;
  low: number | null;
  prevClose: number | null;
};

type LongbridgeQuoteSnapshot = {
  provider: "Longbridge";
  retrievedAt: string;
  quote: {
    symbol: string;
    current: {
      lastDone: number | null;
      timestamp: string | null;
      session: string | null;
      isFresh: boolean;
      freshnessSeconds: number | null;
    } | null;
    lastDone: number | null;
    prevClose: number | null;
    open: number | null;
    high: number | null;
    low: number | null;
    timestamp: string | null;
    volume: number | null;
    turnover: number | null;
    tradeStatus: string | null;
    preMarketQuote: SessionQuote | null;
    postMarketQuote: SessionQuote | null;
    overnightQuote: SessionQuote | null;
  };
};

function isLongbridgeSnapshot(value: unknown): value is LongbridgeQuoteSnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return candidate.provider === "Longbridge" && typeof candidate.retrievedAt === "string" && Boolean(candidate.quote);
}

export async function getLongbridgeQuoteSnapshot(symbol: string): Promise<LongbridgeQuoteSnapshot | null> {
  const proxyUrl = process.env.QUOTE_PROXY_URL;
  if (!proxyUrl) return null;

  const url = new URL("/quote", proxyUrl);
  url.searchParams.set("symbol", symbol);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (process.env.QUOTE_PROXY_TOKEN) headers.Authorization = `Bearer ${process.env.QUOTE_PROXY_TOKEN}`;

  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Quote proxy failed with ${response.status}`);

  const payload = await response.json();
  if (!isLongbridgeSnapshot(payload)) throw new Error("Quote proxy returned an invalid Longbridge snapshot");
  return payload;
}
