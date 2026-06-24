# 研究台 / invest2

一个结论先行、证据可展开、数据口径可审计的投资研究网站。

## Current prototype

- Editorial homepage and latest research feed
- Interactive MU decision report
- Market scan and ranked candidate table
- DeepSeek-first LLM provider with an OpenAI Responses API adapter
- Supabase clients and initial database migration
- Server-only key boundaries and environment template
- On-demand stock analysis using FMP, NewsAPI, and DeepSeek
- Six-hour report cache with graceful operation before database setup

The homepage examples are reconstructed from the supplied PDFs. The personal research desk at `/admin` uses live provider data when the server environment is configured.

## Local setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` and fill in values locally.
3. Run the SQL in `supabase/migrations/0001_initial.sql` in the Supabase SQL editor.
4. Run `pnpm dev` and open `http://localhost:3000`.

Do not commit `.env.local`. Supabase secret keys, provider keys, and database URLs are server-only.

## Model switching

The default provider is DeepSeek. To switch after funding an OpenAI API account:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.5
```

DeepSeek structured JSON is validated with Zod and retried up to three times. OpenAI uses the Responses API with Structured Outputs.

## Deployment

Import the GitHub repository into Vercel, copy the environment variables from `.env.example`, and deploy. Add the custom domain only after the preview deployment is verified.
