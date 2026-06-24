export async function getNewsSnapshot(symbol: string, companyName?: string | null) {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return { provider: "NewsAPI", retrievedAt: new Date().toISOString(), articles: [], error: "NEWS_API_KEY is not configured" };

  const url = new URL("https://newsapi.org/v2/everything");
  const query = companyName ? `"${symbol}" OR "${companyName}"` : `"${symbol}"`;
  url.searchParams.set("q", query);
  url.searchParams.set("searchIn", "title,description");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("language", "en");
  url.searchParams.set("pageSize", "15");

  try {
    const response = await fetch(url, { headers: { "X-Api-Key": apiKey }, signal: AbortSignal.timeout(20_000), cache: "no-store" });
    if (!response.ok) throw new Error(`NewsAPI failed with ${response.status}`);
    const data = await response.json() as { articles?: Array<Record<string, unknown>> };
    return {
      provider: "NewsAPI",
      retrievedAt: new Date().toISOString(),
      articles: (data.articles ?? []).map((article, index) => ({
        id: `news:${index + 1}`,
        title: article.title,
        description: article.description,
        publisher: (article.source as { name?: string } | undefined)?.name,
        author: article.author,
        publishedAt: article.publishedAt,
        url: article.url,
      })),
    };
  } catch (error) {
    return { provider: "NewsAPI", retrievedAt: new Date().toISOString(), articles: [], error: error instanceof Error ? error.message : "unknown error" };
  }
}
