"""SQLite cache for LLM responses keyed by content signature."""
import hashlib
import json
import os
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

CACHE_PATH = os.environ.get("CACHE_PATH", "cache.sqlite")


@dataclass
class CachedResponse:
    text: str
    input_tokens: int
    output_tokens: int
    provider_model: str
    cached: bool = True


def _conn():
    p = Path(CACHE_PATH)
    p.parent.mkdir(parents=True, exist_ok=True)
    c = sqlite3.connect(str(p))
    c.execute("""
        CREATE TABLE IF NOT EXISTS llm_cache (
            key TEXT PRIMARY KEY,
            use_case TEXT,
            params_hash TEXT,
            provider_model TEXT,
            response_text TEXT,
            input_tokens INTEGER,
            output_tokens INTEGER,
            created_at TEXT
        )
    """)
    return c


def make_key(use_case: str, params: dict, content_signature: str, provider_model: str) -> str:
    payload = json.dumps({
        "use_case": use_case,
        "params": params,
        "content": content_signature,
        "model": provider_model,
    }, sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()


def cache_get(key: str) -> Optional[CachedResponse]:
    with _conn() as c:
        row = c.execute(
            "SELECT response_text, input_tokens, output_tokens, provider_model FROM llm_cache WHERE key = ?",
            (key,),
        ).fetchone()
    if row is None:
        return None
    return CachedResponse(
        text=row[0], input_tokens=row[1], output_tokens=row[2],
        provider_model=row[3], cached=True,
    )


def cache_set(key: str, use_case: str, params_hash: str, provider_model: str,
              response_text: str, input_tokens: int, output_tokens: int) -> None:
    with _conn() as c:
        c.execute("""
            INSERT OR REPLACE INTO llm_cache
            (key, use_case, params_hash, provider_model, response_text,
             input_tokens, output_tokens, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (key, use_case, params_hash, provider_model, response_text,
              input_tokens, output_tokens, datetime.now(timezone.utc).isoformat()))


def cached_complete(use_case: str, params: dict, content_signature: str,
                    system: str, user: str, max_tokens: int = 800) -> CachedResponse:
    """Cache-then-call. Returns CachedResponse with .cached flag."""
    from .providers import get_llm
    llm = get_llm()
    provider_model = f"{llm.provider_name if hasattr(llm, 'provider_name') else 'groq'}:{llm.model}"

    key = make_key(use_case, params, content_signature, provider_model)
    hit = cache_get(key)
    if hit is not None:
        return hit

    resp = llm.complete(system=system, user=user, max_tokens=max_tokens)
    cache_set(
        key=key, use_case=use_case,
        params_hash=hashlib.sha256(json.dumps(params, sort_keys=True).encode()).hexdigest(),
        provider_model=provider_model,
        response_text=resp.text,
        input_tokens=resp.input_tokens, output_tokens=resp.output_tokens,
    )
    return CachedResponse(
        text=resp.text, input_tokens=resp.input_tokens, output_tokens=resp.output_tokens,
        provider_model=provider_model, cached=False,
    )