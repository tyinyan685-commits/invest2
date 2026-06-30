# invest quote proxy

Small Longbridge quote proxy for the personal research site.

Deploy this service separately from Vercel, for example on Railway, Render, Fly.io, or a small VPS. The main site calls this HTTP service through `QUOTE_PROXY_URL`, so the heavy Longbridge SDK is not bundled into Vercel serverless functions.

For Railway, set the service root directory to `/quote-proxy`. The included
`railway.json` forces Docker/Python builds, so Railway must not run `pnpm install`.

## Environment variables

Required:

```bash
LONGBRIDGE_APP_KEY=...
LONGBRIDGE_APP_SECRET=...
LONGBRIDGE_ACCESS_TOKEN=...
QUOTE_PROXY_TOKEN=choose-a-random-shared-secret
```

Optional:

```bash
LONGBRIDGE_ENABLE_OVERNIGHT=true
LONGBRIDGE_REGION=hk
```

## Local run

```bash
cd quote-proxy
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8080
```

Test:

```bash
curl -H "Authorization: Bearer $QUOTE_PROXY_TOKEN" \
  "http://127.0.0.1:8080/quote?symbol=MU"
```

## Connect Vercel

Set these on the main Vercel project:

```bash
QUOTE_PROXY_URL=https://your-quote-proxy.example.com
QUOTE_PROXY_TOKEN=the-same-shared-secret
```

The research app will then prefer Longbridge broker quotes over FMP extended-hours quotes.
