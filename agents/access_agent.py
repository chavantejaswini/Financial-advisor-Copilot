"""
Access Agent: gathers all data relevant to a client meeting.

Two backends, transparent to callers:
  1. Salesforce (preferred) — SOQL queries against Account, Contact, Task, Opportunity.
  2. CSV (fallback)        — local fixtures in data/ for portfolio reviewers without an org.

The CSV path is the original implementation. The SF path mirrors its schema so the
Connection + Summary agents downstream don't care which source produced the context.

Returned shape:
  {
    "source": "salesforce" | "csv",
    "client_id": <str>,
    "client_profile": {...},
    "crm_notes": [...],
    "portfolio_activity": [...],
    "client_goals": [...],
    "compliance_considerations": [...],
    "market_updates": [...],
  }
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Optional

import pandas as pd

from .salesforce_client import call as sf_call, get_sf, is_configured as sf_is_configured

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


# ---------- CSV path (fallback) ----------

def load_all_data(data_dir: Optional[Path] = None) -> dict:
    """Load every CSV under data/ into a dict of DataFrames. Used by /api/clients too."""
    base = data_dir or DATA_DIR
    files = {
        "clients": "clients.csv",
        "crm_notes": "crm_notes.csv",
        "portfolio_activity": "portfolio_activity.csv",
        "market_updates": "market_updates.csv",
        "client_goals": "client_goals.csv",
        "compliance_considerations": "compliance_considerations.csv",
    }
    return {
        key: (pd.read_csv(base / fn) if (base / fn).exists() else pd.DataFrame())
        for key, fn in files.items()
    }


def _csv_client_context(client_id: str, data_dir: Optional[Path] = None) -> dict:
    raw = load_all_data(data_dir)
    clients = raw.get("clients", pd.DataFrame())
    client_row = clients[clients["client_id"] == client_id] if not clients.empty else clients
    if client_row.empty:
        return {"error": f"Client {client_id} not found"}

    def _slice(df, col="client_id"):
        return df[df[col] == client_id].to_dict("records") if not df.empty else []

    return {
        "source": "csv",
        "client_id": client_id,
        "client_profile": client_row.iloc[0].to_dict(),
        "crm_notes": _slice(raw.get("crm_notes", pd.DataFrame())),
        "portfolio_activity": _slice(raw.get("portfolio_activity", pd.DataFrame())),
        "client_goals": _slice(raw.get("client_goals", pd.DataFrame())),
        "compliance_considerations": _slice(raw.get("compliance_considerations", pd.DataFrame())),
        "market_updates": raw.get("market_updates", pd.DataFrame()).to_dict("records"),
    }


# ---------- Salesforce path ----------

def list_clients_sf() -> list[dict]:
    """List Accounts from Salesforce for the client dropdown.

    `client_id` is the Account Id (or External_Id__c if seeded with one).
    """
    res = sf_call(lambda sf: sf.query(
        "SELECT Id, Name, Type, Industry, Description "
        "FROM Account WHERE Name != null ORDER BY Name LIMIT 200"
    ))
    return [
        {"client_id": r["Id"], "client_name": r["Name"]}
        for r in res.get("records", [])
    ]


def _profile_from_account(acc: dict) -> dict:
    """Best-effort mapping of Account fields → the legacy client_profile shape.

    risk_tolerance / aum_band / etc. are stuffed into Account.Description as a tiny
    JSON blob by the seed script so we can demo without deploying custom fields.
    """
    profile = {
        "client_id": acc.get("Id"),
        "client_name": acc.get("Name"),
        "account_type": acc.get("Type") or "",
        "industry": acc.get("Industry") or "",
        "relationship_start": acc.get("CreatedDate", "")[:10] if acc.get("CreatedDate") else "",
    }
    desc = acc.get("Description") or ""
    if desc.strip().startswith("{"):
        try:
            extras = json.loads(desc)
            profile.update({
                "risk_tolerance": extras.get("risk_tolerance", ""),
                "aum_band": extras.get("aum_band", ""),
                "primary_advisor_notes": extras.get("primary_advisor_notes", ""),
            })
        except json.JSONDecodeError:
            profile["primary_advisor_notes"] = desc
    else:
        profile["primary_advisor_notes"] = desc
    return profile


def _sf_client_context(client_id: str) -> dict:
    """SOQL-driven version of get_client_context. client_id is the Account Id."""
    try:
        acc = sf_call(lambda sf: sf.Account.get(client_id))
    except Exception as e:
        return {"error": f"Account {client_id} not found in Salesforce: {e}"}

    aid = acc["Id"]

    crm_notes_q = sf_call(lambda sf: sf.query(
        "SELECT Id, Subject, Description, ActivityDate, Status, TaskSubtype "
        f"FROM Task WHERE WhatId = '{aid}' AND Status = 'Completed' "
        "ORDER BY ActivityDate DESC NULLS LAST LIMIT 25"
    ))
    crm_notes = [
        {
            "note_id": r["Id"],
            "client_id": aid,
            "note_date": r.get("ActivityDate") or "",
            "note_type": r.get("TaskSubtype") or "Task",
            "summary": r.get("Subject") or "",
            "details": r.get("Description") or "",
        }
        for r in crm_notes_q.get("records", [])
    ]

    open_tasks_q = sf_call(lambda sf: sf.query(
        "SELECT Id, Subject, Description, ActivityDate, Status, Priority "
        f"FROM Task WHERE WhatId = '{aid}' AND Status != 'Completed' "
        "ORDER BY ActivityDate ASC NULLS LAST LIMIT 25"
    ))
    open_tasks = [
        {
            "task_id": r["Id"],
            "subject": r.get("Subject") or "",
            "due": r.get("ActivityDate") or "",
            "status": r.get("Status") or "",
            "priority": r.get("Priority") or "",
            "details": r.get("Description") or "",
        }
        for r in open_tasks_q.get("records", [])
    ]

    opps_q = sf_call(lambda sf: sf.query(
        "SELECT Id, Name, StageName, Amount, CloseDate, Description "
        f"FROM Opportunity WHERE AccountId = '{aid}' ORDER BY CloseDate DESC LIMIT 25"
    ))
    client_goals = [
        {
            "goal_id": r["Id"],
            "client_id": aid,
            "goal_name": r.get("Name") or "",
            "target_amount": r.get("Amount"),
            "target_date": r.get("CloseDate") or "",
            "status": r.get("StageName") or "",
            "details": r.get("Description") or "",
        }
        for r in opps_q.get("records", [])
    ]

    return {
        "source": "salesforce",
        "client_id": aid,
        "client_profile": _profile_from_account(acc),
        "crm_notes": crm_notes,
        "open_tasks": open_tasks,
        "portfolio_activity": [],          # not modeled in standard objects; left empty in SF mode
        "client_goals": client_goals,
        "compliance_considerations": [],   # ditto; layer in custom objects later
        "market_updates": _market_updates_csv(),
    }


def _market_updates_csv() -> list[dict]:
    """Market updates aren't per-account — load from the local CSV in both modes."""
    path = DATA_DIR / "market_updates.csv"
    if not path.exists():
        return []
    return pd.read_csv(path).to_dict("records")


# ---------- public entry point ----------

def get_client_context(client_id: str, data_dir: Optional[Path] = None) -> dict:
    """Return unified client context. Prefers Salesforce; falls back to CSV.

    Set CRM_BACKEND=csv in env to force the fallback path (useful for offline demos).
    """
    forced = (os.getenv("CRM_BACKEND") or "").lower()
    if forced == "csv":
        return _csv_client_context(client_id, data_dir=data_dir)
    if forced == "salesforce" or sf_is_configured():
        try:
            return _sf_client_context(client_id)
        except Exception as e:
            logger.warning("Salesforce fetch failed, falling back to CSV: %s", e)
    return _csv_client_context(client_id, data_dir=data_dir)
