"""
Salesforce client singleton.

Auth via Dev Edition username/password/security-token (simple-salesforce).
Reads env vars:
  SF_USERNAME, SF_PASSWORD, SF_SECURITY_TOKEN, SF_DOMAIN (optional, e.g. "login" or "test")

`is_configured()` lets callers degrade to CSV fallback when creds aren't set,
so the app still runs end-to-end for portfolio reviewers without a Salesforce org.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

_sf = None  # cached Salesforce client


def _clean(value: str) -> str:
    if not value:
        return ""
    return value.strip().strip('"').strip("'").strip()


def is_configured() -> bool:
    """True if all required SF env vars are set with non-placeholder values."""
    user = _clean(os.getenv("SF_USERNAME", ""))
    pwd = _clean(os.getenv("SF_PASSWORD", ""))
    token = _clean(os.getenv("SF_SECURITY_TOKEN", ""))
    if not user or not pwd or not token:
        return False
    placeholders = {"your-sf-username", "your-sf-password", "your-sf-token", ""}
    return user.lower() not in placeholders and pwd.lower() not in placeholders and token.lower() not in placeholders


def get_sf():
    """Return a cached simple-salesforce client.

    Prefers OAuth username-password flow (requires AGENTFORCE_CLIENT_ID/SECRET from a
    Connected App) because most newer Dev Edition orgs ship with SOAP login disabled.
    Falls back to legacy SOAP login if no Connected App creds are provided.
    """
    global _sf
    if _sf is not None:
        return _sf
    if not is_configured():
        raise RuntimeError(
            "Salesforce is not configured. Set SF_USERNAME, SF_PASSWORD, SF_SECURITY_TOKEN in .env, "
            "or unset them to use CSV fallback mode."
        )
    import requests
    from simple_salesforce import Salesforce  # imported lazily so app can boot without the package wired

    user = _clean(os.getenv("SF_USERNAME"))
    pwd = _clean(os.getenv("SF_PASSWORD"))
    token = _clean(os.getenv("SF_SECURITY_TOKEN"))
    domain = _clean(os.getenv("SF_DOMAIN", "login")) or "login"
    client_id = _clean(os.getenv("AGENTFORCE_CLIENT_ID", ""))
    client_secret = _clean(os.getenv("AGENTFORCE_CLIENT_SECRET", ""))

    if client_id and client_secret:
        # OAuth via Connected App / External Client App.
        # Prefer Client Credentials Flow (modern, MFA-immune); fall back to
        # username-password if the ECA isn't configured with a Run As User.
        mydomain = _clean(os.getenv("SF_MYDOMAIN", ""))
        token_url = (
            f"{mydomain}/services/oauth2/token"
            if mydomain.startswith("http")
            else f"https://{domain}.salesforce.com/services/oauth2/token"
        )

        def _post(data: dict):
            return requests.post(token_url, data=data, timeout=30)

        resp = _post({
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
        })
        if resp.status_code != 200:
            logger.info(
                "client_credentials failed (%s); falling back to password grant", resp.status_code
            )
            resp = _post({
                "grant_type": "password",
                "client_id": client_id,
                "client_secret": client_secret,
                "username": user,
                "password": pwd + token,
            })
        resp.raise_for_status()
        payload = resp.json()
        instance_url = payload["instance_url"]
        access_token = payload["access_token"]
        instance = instance_url.replace("https://", "").replace("http://", "")
        _sf = Salesforce(instance=instance, session_id=access_token)
        logger.info("Connected to Salesforce via OAuth (instance=%s)", instance)
    else:
        _sf = Salesforce(username=user, password=pwd, security_token=token, domain=domain)
        logger.info("Connected to Salesforce via SOAP login (instance=%s, domain=%s)", _sf.sf_instance, domain)
    return _sf


def reset() -> None:
    """Drop the cached client so the next get_sf() re-authenticates."""
    global _sf
    _sf = None


def _is_expired_session(err: Exception) -> bool:
    s = str(err)
    return "INVALID_SESSION_ID" in s or "Session expired or invalid" in s


def call(fn):
    """Run fn(sf_client), transparently re-authenticating ONCE if the cached
    Salesforce session has expired.

    Salesforce access tokens expire after the org's session timeout. We cache the
    client for performance, so a long-running process will eventually hold a dead
    token. This wrapper catches INVALID_SESSION_ID, drops the cache, logs in again,
    and retries — so callers never see a transient expiry.
    """
    try:
        return fn(get_sf())
    except Exception as e:
        if _is_expired_session(e):
            logger.info("Salesforce session expired — re-authenticating and retrying once")
            reset()
            return fn(get_sf())
        raise


def probe() -> Optional[str]:
    """Lightweight connectivity check used by /api/health. Returns instance URL or None."""
    try:
        sf = get_sf()
        return f"https://{sf.sf_instance}"
    except Exception as e:
        logger.warning("Salesforce probe failed: %s", e)
        return None
