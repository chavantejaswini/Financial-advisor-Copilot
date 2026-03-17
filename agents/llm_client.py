"""
Shared OpenAI client for agents. Uses OPENAI_API_KEY and optional OPENAI_BASE_URL for custom endpoint.
"""

import os
from openai import OpenAI

_client = None


def _clean_env(value: str) -> str:
    """Strip whitespace and surrounding quotes (common when pasting from .env examples)."""
    if not value:
        return value
    return value.strip().strip('"').strip("'").strip()


def get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = _clean_env(os.getenv("OPENAI_API_KEY", ""))
        base_url = _clean_env(os.getenv("OPENAI_BASE_URL", "") or "")
        if not api_key or api_key == "your-openai-api-key-here":
            raise ValueError(
                "OPENAI_API_KEY is missing or still the placeholder. "
                "Set it in .env with your real key (no quotes needed): OPENAI_API_KEY=sk-..."
            )
        _client = OpenAI(api_key=api_key, base_url=base_url if base_url else None)
    return _client


def chat_completion(messages: list, model: str = "gpt-4o-mini", temperature: float = 0.3) -> str:
    """Single completion call; returns content string or raises."""
    client = get_client()
    resp = client.chat.completions.create(model=model, messages=messages, temperature=temperature)
    return resp.choices[0].message.content or ""
