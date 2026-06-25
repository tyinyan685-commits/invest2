const FMP_BASE_URL = "https://financialmodelingprep.com/stable";

export interface PriceBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type JsonValue = Record<string, unknown> | Array<Record<string, unknown>>;
type FilingText = { formType: string; filingDate: string; url: string; title: string; text: string };

async function fmpFetch(path: string, params: Record<string, string | number> = {}): Promise<JsonValue> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) throw new Error("FMP_API_KEY is not configured");
  const url = new URL(`${FMP_BASE_URL}/${path}`);
  Object.entries({ ...params, apikey: apiKey }).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000), cache: "no-store" });
  if (!response.ok) throw new Error(`FMP ${path} failed with ${response.status}`);
  return response.json() as Promise<JsonValue>;
}

function rows(value: JsonValue): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value;
  const historical = value.historical;
  return Array.isArray(historical) ? historical as Array<Record<string, unknown>> : [value];
}

function firstValidRow(value: JsonValue): Record<string, unknown> | null {
  const row = rows(value)[0];
  return row && typeof row.error !== "string" ? row : null;
}

function number(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function cleanFilingHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#160;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchFilingText(filing: Record<string, unknown>): Promise<FilingText | null> {
  const url = text(filing.finalLink) || text(filing.link);
  if (!url || !/^https:\/\/www\.sec\.gov\//i.test(url)) return null;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "invest2 personal research contact@example.com",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const cleaned = cleanFilingHtml(await response.text());
    if (cleaned.length < 200) return null;
    return {
      formType: text(filing.formType),
      filingDate: text(filing.filingDate),
      url,
      title: cleaned.slice(0, 160),
      text: cleaned.slice(0, 6_000),
    };
  } catch {
    return null;
  }
}

function sma(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((sum, value) => sum + value, 0) / period;
}

function emaSeries(values: number[], period: number): number[] {
  if (!values.length) return [];
  const multiplier = 2 / (period + 1);
  const result = [values[0]];
  for (let index = 1; index < values.length; index += 1) result.push(values[index] * multiplier + result[index - 1] * (1 - multiplier));
  return result;
}

function ema(values: number[], period: number): number | null {
  return values.length >= period ? emaSeries(values, period).at(-1) ?? null : null;
}

function standardDeviation(values: number[]) {
  if (!values.length) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
}

function atr(bars: PriceBar[], period = 14): number | null {
  if (bars.length <= period) return null;
  const trueRanges = bars.slice(1).map((bar, index) => Math.max(bar.high - bar.low, Math.abs(bar.high - bars[index].close), Math.abs(bar.low - bars[index].close)));
  return sma(trueRanges, period);
}

function vwma(bars: PriceBar[], period = 20): number | null {
  if (bars.length < period) return null;
  const slice = bars.slice(-period);
  const volume = slice.reduce((sum, bar) => sum + bar.volume, 0);
  return volume ? slice.reduce((sum, bar) => sum + bar.close * bar.volume, 0) / volume : null;
}

function rsi(values: number[], period = 14): number | null {
  if (values.length <= period) return null;
  const changes = values.slice(-(period + 1)).slice(1).map((value, index) => value - values.slice(-(period + 1))[index]);
  const gains = changes.reduce((sum, change) => sum + Math.max(change, 0), 0) / period;
  const losses = changes.reduce((sum, change) => sum + Math.max(-change, 0), 0) / period;
  if (losses === 0) return 100;
  return 100 - 100 / (1 + gains / losses);
}

export async function getFmpSnapshot(symbol: string) {
  const to = new Date();
  const from = new Date(to);
  from.setUTCFullYear(to.getUTCFullYear() - 1);
  const date = (value: Date) => value.toISOString().slice(0, 10);

  const requests = {
    quote: fmpFetch("quote", { symbol }),
    profile: fmpFetch("profile", { symbol }),
    income: fmpFetch("income-statement", { symbol, period: "annual", limit: 4 }),
    balance: fmpFetch("balance-sheet-statement", { symbol, period: "annual", limit: 4 }),
    cashflow: fmpFetch("cash-flow-statement", { symbol, period: "annual", limit: 4 }),
    ratios: fmpFetch("ratios", { symbol, period: "annual", limit: 4 }),
    metrics: fmpFetch("key-metrics", { symbol, period: "annual", limit: 4 }),
    estimates: fmpFetch("analyst-estimates", { symbol, period: "annual", limit: 4 }),
    history: fmpFetch("historical-price-eod/full", { symbol, from: date(from), to: date(to) }),
    insiderTrading: fmpFetch("insider-trading/search", { symbol, limit: 50 }),
    secFilings: fmpFetch("sec-filings-search/symbol", { symbol, from: date(from), to: date(to), limit: 30 }),
    earningsCalendar: fmpFetch("earnings-calendar", { from: date(to), to: date(new Date(to.getTime() + 45 * 86_400_000)) }),
    treasuryRates: fmpFetch("treasury-rates", { from: date(new Date(to.getTime() - 14 * 86_400_000)), to: date(to) }),
    economicCalendar: fmpFetch("economic-calendar", { from: date(to), to: date(new Date(to.getTime() + 21 * 86_400_000)) }),
    socialSentiment: fmpFetch("historical-social-sentiment", { symbol, limit: 100 }),
  };

  const entries = await Promise.all(Object.entries(requests).map(async ([key, request]) => {
    try { return [key, await request] as const; }
    catch (error) { return [key, { error: error instanceof Error ? error.message : "unknown error" }] as const; }
  }));
  const raw = Object.fromEntries(entries) as Record<string, JsonValue>;
  const secFilings = rows(raw.secFilings ?? []).slice(0, 30);
  const secFilingTexts = (await Promise.all(secFilings
    .filter((filing) => /8-K|10-Q|10-K/i.test(text(filing.formType)))
    .slice(0, 3)
    .map(fetchFilingText))).filter((filing): filing is FilingText => filing !== null);
  const history = rows(raw.history ?? []).map((row) => ({
    date: String(row.date ?? ""),
    open: number(row.open) ?? 0,
    high: number(row.high) ?? 0,
    low: number(row.low) ?? 0,
    close: number(row.close) ?? 0,
    volume: number(row.volume) ?? 0,
  })).filter((bar) => bar.date && bar.close > 0).sort((a, b) => a.date.localeCompare(b.date));
  const closes = history.map((bar) => bar.close);
  const ema12 = emaSeries(closes, 12);
  const ema26 = emaSeries(closes, 26);
  const macdSeries = closes.map((_, index) => (ema12[index] ?? 0) - (ema26[index] ?? 0));
  const signalSeries = emaSeries(macdSeries, 9);
  const bollingerSlice = closes.slice(-20);
  const bollingerMiddle = sma(closes, 20);
  const bollingerStdDev = standardDeviation(bollingerSlice);
  const last = history.at(-1);
  const first = history[0];
  const yearStart = history.find((bar) => bar.date.slice(0, 4) === (last?.date ?? "").slice(0, 4));
  const recentTen = history.slice(-10);
  const averageVolume20 = sma(history.map((bar) => bar.volume), 20);

  return {
    provider: "FMP",
    retrievedAt: new Date().toISOString(),
    quote: firstValidRow(raw.quote ?? []),
    profile: firstValidRow(raw.profile ?? []),
    financials: {
      income: rows(raw.income ?? []).slice(0, 4),
      balance: rows(raw.balance ?? []).slice(0, 4),
      cashflow: rows(raw.cashflow ?? []).slice(0, 4),
      ratios: rows(raw.ratios ?? []).slice(0, 4),
      metrics: rows(raw.metrics ?? []).slice(0, 4),
      estimates: rows(raw.estimates ?? []).slice(0, 4),
    },
    technicals: {
      asOf: last?.date ?? null,
      close: last?.close ?? null,
      oneYearReturnPct: first && last ? ((last.close / first.close) - 1) * 100 : null,
      high52Week: history.length ? Math.max(...history.map((bar) => bar.high)) : null,
      low52Week: history.length ? Math.min(...history.map((bar) => bar.low)) : null,
      sma20: sma(closes, 20),
      sma50: sma(closes, 50),
      sma200: sma(closes, 200),
      ema10: ema(closes, 10),
      rsi14: rsi(closes),
      macd: macdSeries.at(-1) ?? null,
      macdSignal: signalSeries.at(-1) ?? null,
      macdHistogram: macdSeries.length && signalSeries.length ? (macdSeries.at(-1) ?? 0) - (signalSeries.at(-1) ?? 0) : null,
      bollingerMiddle,
      bollingerUpper: bollingerMiddle === null ? null : bollingerMiddle + 2 * bollingerStdDev,
      bollingerLower: bollingerMiddle === null ? null : bollingerMiddle - 2 * bollingerStdDev,
      atr14: atr(history),
      atrPct: last?.close ? ((atr(history) ?? 0) / last.close) * 100 : null,
      vwma20: vwma(history),
      volumeRatio20: last && averageVolume20 ? last.volume / averageVolume20 : null,
      ytdReturnPct: yearStart && last ? ((last.close / yearStart.close) - 1) * 100 : null,
      swingHigh10: recentTen.length ? Math.max(...recentTen.map((bar) => bar.high)) : null,
      swingLow10: recentTen.length ? Math.min(...recentTen.map((bar) => bar.low)) : null,
    },
    context: {
      insiderTrading: rows(raw.insiderTrading ?? []).slice(0, 50),
      secFilings,
      secFilingTexts,
      earningsCalendar: rows(raw.earningsCalendar ?? []).filter((row) => row.symbol === symbol).slice(0, 5),
      treasuryRates: rows(raw.treasuryRates ?? []).slice(0, 14),
      economicCalendar: rows(raw.economicCalendar ?? []).filter((row) => {
        const country = String(row.country ?? "");
        const impact = String(row.impact ?? "");
        return /US|United States/i.test(country) && /High|Medium/i.test(impact);
      }).slice(0, 30),
      socialSentiment: rows(raw.socialSentiment ?? []).slice(0, 100),
    },
    recentBars: history.slice(-30),
    errors: Object.fromEntries(Object.entries(raw).flatMap(([key, value]) => {
      if (Array.isArray(value) || typeof value.error !== "string") return [];
      return [[key, value.error]];
    })),
  };
}
