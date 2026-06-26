from __future__ import annotations

import os
import time
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, Header, HTTPException, Query


app = FastAPI(title="invest quote proxy", version="1.0.0")


def _number(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _field(obj: Any, *names: str) -> Any:
    for name in names:
        if obj is None:
            return None
        if isinstance(obj, dict) and name in obj:
            return obj[name]
        if hasattr(obj, name):
            return getattr(obj, name)
    return None


def _iso_timestamp(value: Any) -> str | None:
    timestamp = _int(value)
    if timestamp is None or timestamp <= 0:
        return None
    return datetime.fromtimestamp(timestamp, timezone.utc).isoformat()


def _normalize_symbol(symbol: str) -> str:
    value = symbol.strip().upper()
    if not value:
        raise HTTPException(status_code=400, detail="symbol is required")
    if "." in value:
        return value
    if value.isdigit():
        return f"{value}.HK"
    return f"{value}.US"


def _session_quote(obj: Any) -> dict[str, Any] | None:
    if obj is None:
        return None
    return {
        "lastDone": _number(_field(obj, "last_done", "lastDone")),
        "timestamp": _iso_timestamp(_field(obj, "timestamp")),
        "volume": _int(_field(obj, "volume")),
        "turnover": _number(_field(obj, "turnover")),
        "high": _number(_field(obj, "high")),
        "low": _number(_field(obj, "low")),
        "prevClose": _number(_field(obj, "prev_close", "prevClose")),
    }


def _pick_current(regular: dict[str, Any], sessions: dict[str, dict[str, Any] | None]) -> dict[str, Any] | None:
    candidates: list[tuple[str, dict[str, Any]]] = []
    if regular.get("lastDone") is not None:
        candidates.append(("regular", regular))
    for name, quote in sessions.items():
        if quote and quote.get("lastDone") is not None:
            candidates.append((name, quote))
    if not candidates:
        return None

    def score(item: tuple[str, dict[str, Any]]) -> int:
        _, quote = item
        ts = quote.get("timestamp")
        if not ts:
            return 0
        try:
            return int(datetime.fromisoformat(ts).timestamp())
        except ValueError:
            return 0

    session, quote = max(candidates, key=score)
    now = int(time.time())
    timestamp = quote.get("timestamp")
    freshness_seconds = None
    if timestamp:
        try:
            freshness_seconds = max(0, now - int(datetime.fromisoformat(timestamp).timestamp()))
        except ValueError:
            freshness_seconds = None
    return {
        "lastDone": quote.get("lastDone"),
        "timestamp": timestamp,
        "session": session,
        "isFresh": freshness_seconds is not None and freshness_seconds <= 60,
        "freshnessSeconds": freshness_seconds,
    }


def _check_auth(authorization: str | None) -> None:
    token = os.environ.get("QUOTE_PROXY_TOKEN")
    if not token:
        return
    if authorization != f"Bearer {token}":
        raise HTTPException(status_code=401, detail="invalid proxy token")


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"ok": "true"}


@app.get("/quote")
def quote(symbol: str = Query(..., min_length=1, max_length=24), authorization: str | None = Header(default=None)) -> dict[str, Any]:
    _check_auth(authorization)

    try:
        from longbridge.openapi import Config, QuoteContext
    except Exception as exc:  # pragma: no cover - deployment/runtime dependency
        raise HTTPException(status_code=500, detail=f"longbridge SDK is not installed: {exc}") from exc

    longbridge_symbol = _normalize_symbol(symbol)
    try:
        config = Config.from_apikey_env()
        ctx = QuoteContext(config)
        response = ctx.quote([longbridge_symbol])
    except Exception as exc:  # pragma: no cover - depends on broker API
        raise HTTPException(status_code=502, detail=f"longbridge quote failed: {exc}") from exc

    raw_quote = response[0] if response else None
    if raw_quote is None:
        raise HTTPException(status_code=404, detail="quote not found")

    regular = {
        "symbol": _field(raw_quote, "symbol") or longbridge_symbol,
        "lastDone": _number(_field(raw_quote, "last_done", "lastDone")),
        "prevClose": _number(_field(raw_quote, "prev_close", "prevClose")),
        "open": _number(_field(raw_quote, "open")),
        "high": _number(_field(raw_quote, "high")),
        "low": _number(_field(raw_quote, "low")),
        "timestamp": _iso_timestamp(_field(raw_quote, "timestamp")),
        "volume": _int(_field(raw_quote, "volume")),
        "turnover": _number(_field(raw_quote, "turnover")),
        "tradeStatus": str(_field(raw_quote, "trade_status", "tradeStatus")) if _field(raw_quote, "trade_status", "tradeStatus") is not None else None,
    }
    sessions = {
        "premarket": _session_quote(_field(raw_quote, "pre_market_quote", "preMarketQuote")),
        "postmarket": _session_quote(_field(raw_quote, "post_market_quote", "postMarketQuote")),
        "overnight": _session_quote(_field(raw_quote, "over_night_quote", "overnightQuote", "overNightQuote")),
    }

    return {
        "provider": "Longbridge",
        "retrievedAt": datetime.now(timezone.utc).isoformat(),
        "quote": {
            **regular,
            "current": _pick_current(regular, sessions),
            "preMarketQuote": sessions["premarket"],
            "postMarketQuote": sessions["postmarket"],
            "overnightQuote": sessions["overnight"],
        },
    }
