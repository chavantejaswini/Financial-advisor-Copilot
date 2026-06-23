"""
Agentforce API client.

Invokes a custom Agentforce Agent configured in your Salesforce org (Setup → Agents).
The agent runs server-side inside Salesforce — this module just opens a session,
sends a message, and returns the response.

Auth flow used here is OAuth username-password (works with a Connected App in a
Dev Edition org). For production you'd switch to JWT-Bearer; see SALESFORCE_SETUP.md.

Required env vars:
  AGENTFORCE_AGENT_ID        Salesforce Id (18-char) of the custom Agent
  AGENTFORCE_CLIENT_ID       Consumer Key from your Connected App
  AGENTFORCE_CLIENT_SECRET   Consumer Secret from your Connected App
  SF_USERNAME, SF_PASSWORD, SF_SECURITY_TOKEN  (re-used from simple-salesforce config)

Optional:
  AGENTFORCE_API_VERSION     defaults to "v62.0" — bump to match your org's release
  SF_DOMAIN                  "login" (prod/dev) or "test" (sandbox), defaults to "login"

Note: the Agentforce REST surface has changed between releases. If you get 404s on
the session/message endpoints, check Salesforce's "Agent API Developer Guide" for
the path matching your AGENTFORCE_API_VERSION and adjust _agent_base() accordingly.
"""

from __future__ import annotations

import logging
import os
import uuid
from typing import Optional

import requests

logger = logging.getLogger(__name__)


def _clean(v: str) -> str:
    if not v:
        return ""
    return v.strip().strip('"').strip("'").strip()


def is_configured() -> bool:
    """True when Agentforce-specific env vars are populated."""
    return bool(
        _clean(os.getenv("AGENTFORCE_AGENT_ID", ""))
        and _clean(os.getenv("AGENTFORCE_CLIENT_ID", ""))
        and _clean(os.getenv("AGENTFORCE_CLIENT_SECRET", ""))
        and _clean(os.getenv("SF_USERNAME", ""))
        and _clean(os.getenv("SF_PASSWORD", ""))
    )


_token_cache: dict = {}


def _oauth_token() -> dict:
    """Return {access_token, instance_url}; cached per-process for the session lifetime."""
    if _token_cache.get("access_token"):
        return _token_cache
    domain = _clean(os.getenv("SF_DOMAIN", "login")) or "login"
    token_url = f"https://{domain}.salesforce.com/services/oauth2/token"
    pwd = _clean(os.getenv("SF_PASSWORD")) + _clean(os.getenv("SF_SECURITY_TOKEN", ""))
    data = {
        "grant_type": "password",
        "client_id": _clean(os.getenv("AGENTFORCE_CLIENT_ID")),
        "client_secret": _clean(os.getenv("AGENTFORCE_CLIENT_SECRET")),
        "username": _clean(os.getenv("SF_USERNAME")),
        "password": pwd,
    }
    r = requests.post(token_url, data=data, timeout=30)
    r.raise_for_status()
    payload = r.json()
    _token_cache.update({
        "access_token": payload["access_token"],
        "instance_url": payload["instance_url"],
    })
    return _token_cache


def _agent_base(instance_url: str) -> str:
    """Base path for the Agentforce sessions/messages endpoints."""
    api_version = _clean(os.getenv("AGENTFORCE_API_VERSION", "v62.0")) or "v62.0"
    return f"{instance_url}/services/data/{api_version}/einstein/ai-agent"


def _start_session(agent_id: str) -> tuple[str, str]:
    tok = _oauth_token()
    url = f"{_agent_base(tok['instance_url'])}/sessions"
    headers = {"Authorization": f"Bearer {tok['access_token']}", "Content-Type": "application/json"}
    body = {"agentId": agent_id, "externalSessionKey": str(uuid.uuid4())}
    r = requests.post(url, json=body, headers=headers, timeout=60)
    r.raise_for_status()
    sess = r.json()
    return sess.get("sessionId") or sess.get("id"), tok["access_token"]


def invoke_agent(message: str, agent_id: Optional[str] = None) -> dict:
    """Send `message` to the configured Agentforce agent and return its response.

    Returns a dict shaped like {"reply": "...", "raw": {...}}. On failure returns
    {"error": "...", "raw": {...}} — the caller decides whether to fall back to the
    LangChain pipeline output.
    """
    if not is_configured():
        return {"error": "Agentforce not configured; set AGENTFORCE_* env vars."}
    agent_id = agent_id or _clean(os.getenv("AGENTFORCE_AGENT_ID"))
    try:
        session_id, access_token = _start_session(agent_id)
        tok = _oauth_token()
        url = f"{_agent_base(tok['instance_url'])}/sessions/{session_id}/messages"
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
        body = {"message": {"sequenceId": 1, "type": "Text", "text": message}}
        r = requests.post(url, json=body, headers=headers, timeout=120)
        r.raise_for_status()
        payload = r.json()
        # Agentforce responses contain a `messages` array with `message` text in each item.
        msgs = payload.get("messages") or []
        reply = " ".join(m.get("message", "") for m in msgs if m.get("message"))
        return {"reply": reply.strip() or "(no text in agent response)", "session_id": session_id, "raw": payload}
    except requests.HTTPError as e:
        logger.exception("Agentforce HTTP error")
        return {"error": f"HTTP {e.response.status_code}: {e.response.text[:500]}"}
    except Exception as e:
        logger.exception("Agentforce invocation failed")
        return {"error": str(e)}
