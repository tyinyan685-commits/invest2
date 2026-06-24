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

function sma(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((sum, value) => sum + value, 0) / period;
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
  };

  const entries = await Promise.all(Object.entries(requests).map(async ([key, request]) => {
    try { return [key, await request] as const; }
    catch (error) { return [key, { error: error instanceof Error ? error.message : "unknown error" }] as const; }
  }));
  const raw = Object.fromEntries(entries) as Record<string, JsonValue>;
  const history = rows(raw.history ?? []).map((row) => ({
    date: String(row.date ?? ""),
    open: number(row.open) ?? 0,
    high: number(row.high) ?? 0,
    low: number(row.low) ?? 0,
    close: number(row.close) ?? 0,
    volume: number(row.volume) ?? 0,
  })).filter((bar) => bar.date && bar.close > 0).sort((a, b) => a.date.localeCompare(b.date));
  const closes = history.map((bar) => bar.close);
  const last = history.at(-1);
  const first = history[0];

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
      rsi14: rsi(closes),
    },
    recentBars: history.slice(-30),
    errors: Object.fromEntries(Object.entries(raw).flatMap(([key, value]) => {
      if (Array.isArray(value) || typeof value.error !== "string") return [];
      return [[key, value.error]];
    })),
  };
}
