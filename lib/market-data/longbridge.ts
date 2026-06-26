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

function hasLongbridgeCredentials() {
  return Boolean(process.env.LONGBRIDGE_APP_KEY && process.env.LONGBRIDGE_APP_SECRET && process.env.LONGBRIDGE_ACCESS_TOKEN);
}

type LongbridgeQuoteSnapshot = {
  provider: "Longbridge";
  retrievedAt: string;
  quote: {
    symbol: string;
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

export async function getLongbridgeQuoteSnapshot(_symbol: string): Promise<LongbridgeQuoteSnapshot | null> {
  if (!hasLongbridgeCredentials()) return null;
  // The official Node SDK ships native binaries for multiple platforms, which
  // makes Vercel Serverless functions exceed the 250MB uncompressed limit.
  // Keep this hook lightweight and disabled until a pure HTTP/OAuth adapter or
  // a separate quote proxy is added.
  return null;
}
