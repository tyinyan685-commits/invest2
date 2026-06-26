import "server-only";
import { Config, QuoteContext, type PrePostQuote, type SecurityQuote } from "longbridge";

type SessionQuote = {
  lastDone: number | null;
  timestamp: string | null;
  volume: number | null;
  turnover: number | null;
  high: number | null;
  low: number | null;
  prevClose: number | null;
};

function decimal(value: { toNumber(): number } | null | undefined) {
  if (!value) return null;
  const parsed = value.toNumber();
  return Number.isFinite(parsed) ? parsed : null;
}

function date(value: Date | null | undefined) {
  return value instanceof Date && Number.isFinite(value.getTime()) ? value.toISOString() : null;
}

function sessionQuote(quote: PrePostQuote | null): SessionQuote | null {
  if (!quote) return null;
  return {
    lastDone: decimal(quote.lastDone),
    timestamp: date(quote.timestamp),
    volume: Number.isFinite(quote.volume) ? quote.volume : null,
    turnover: decimal(quote.turnover),
    high: decimal(quote.high),
    low: decimal(quote.low),
    prevClose: decimal(quote.prevClose),
  };
}

function securityQuote(quote: SecurityQuote) {
  return {
    symbol: quote.symbol,
    lastDone: decimal(quote.lastDone),
    prevClose: decimal(quote.prevClose),
    open: decimal(quote.open),
    high: decimal(quote.high),
    low: decimal(quote.low),
    timestamp: date(quote.timestamp),
    volume: Number.isFinite(quote.volume) ? quote.volume : null,
    turnover: decimal(quote.turnover),
    tradeStatus: String(quote.tradeStatus),
    preMarketQuote: sessionQuote(quote.preMarketQuote),
    postMarketQuote: sessionQuote(quote.postMarketQuote),
    overnightQuote: sessionQuote(quote.overnightQuote),
  };
}

function hasLongbridgeCredentials() {
  return Boolean(process.env.LONGBRIDGE_APP_KEY && process.env.LONGBRIDGE_APP_SECRET && process.env.LONGBRIDGE_ACCESS_TOKEN);
}

function longbridgeSymbol(symbol: string) {
  if (symbol.includes(".")) return symbol;
  return `${symbol}.US`;
}

export async function getLongbridgeQuoteSnapshot(symbol: string) {
  if (!hasLongbridgeCredentials()) return null;
  const config = Config.fromApikey(
    process.env.LONGBRIDGE_APP_KEY!,
    process.env.LONGBRIDGE_APP_SECRET!,
    process.env.LONGBRIDGE_ACCESS_TOKEN!,
    {
      language: 0,
      enableOvernight: true,
      enablePrintQuotePackages: false,
    },
  );
  const context = QuoteContext.new(config);
  const quotes = await context.quote([longbridgeSymbol(symbol)]);
  const quote = quotes[0];
  if (!quote) return null;
  return {
    provider: "Longbridge",
    retrievedAt: new Date().toISOString(),
    quote: securityQuote(quote),
  };
}
