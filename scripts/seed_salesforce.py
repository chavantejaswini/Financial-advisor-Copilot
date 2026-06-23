"""
Seed a Salesforce (Agentforce) Developer Edition org with the mock advisor data.

Maps the existing CSVs onto **standard** Salesforce objects so this works in a
fresh org with no custom fields deployed:

  clients.csv                  -> Account (Name; Type; Description holds risk/AUM as JSON)
  crm_notes.csv                -> Task (Status='Completed', WhatId=Account)
  client_goals.csv             -> Opportunity (Name=goal; StageName=status; CloseDate from horizon)
  compliance_considerations.csv-> Task (Status='Not Started', Subject prefixed [COMPLIANCE])
  portfolio_activity.csv       -> skipped (would need custom object; not needed for demo)

Idempotent: re-running upserts by Name match on Account, by Subject+AccountId on Task,
and by Name+AccountId on Opportunity. Safe to run multiple times during development.

Usage:
  source venv/bin/activate
  pip install -r requirements.txt
  python scripts/seed_salesforce.py
"""

from __future__ import annotations

import json
import sys
from datetime import date, timedelta
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env")

from agents.salesforce_client import get_sf, is_configured  # noqa: E402

DATA_DIR = ROOT / "data"


def _horizon_to_close_date(horizon: str) -> str:
    """Convert '15 years' / 'Ongoing' / '5 years' / '10+ years' to an ISO close date."""
    if not horizon:
        return (date.today() + timedelta(days=365)).isoformat()
    h = horizon.lower()
    if "ongoing" in h:
        return (date.today() + timedelta(days=365)).isoformat()
    digits = "".join(c for c in h if c.isdigit())
    years = int(digits) if digits else 5
    return (date.today() + timedelta(days=365 * max(1, years))).isoformat()


def _parse_amount(raw) -> float | None:
    import math
    if raw is None:
        return None
    if isinstance(raw, float) and math.isnan(raw):
        return None
    s = str(raw).strip()
    if not s or s.lower() in {"n/a", "nan", "none"}:
        return None
    s = s.replace("$", "").replace(",", "").upper()
    multiplier = 1
    if s.endswith("K"):
        multiplier, s = 1_000, s[:-1]
    elif s.endswith("M"):
        multiplier, s = 1_000_000, s[:-1]
    elif s.endswith("B"):
        multiplier, s = 1_000_000_000, s[:-1]
    try:
        val = float(s) * multiplier
        return None if math.isnan(val) or math.isinf(val) else val
    except ValueError:
        return None


def _upsert_account(sf, row: dict) -> str:
    """Find existing Account by Name; create or update. Returns the Account Id."""
    name = row["client_name"]
    desc_blob = json.dumps({
        "external_client_id": row["client_id"],
        "risk_tolerance": row.get("risk_tolerance"),
        "aum_band": row.get("aum_band"),
        "primary_advisor_notes": row.get("primary_advisor_notes"),
        "relationship_start": row.get("relationship_start"),
    })
    payload = {
        "Name": name,
        "Type": row.get("account_type") or "Customer",
        "Description": desc_blob,
        "Industry": "Financial Services",
    }
    existing = sf.query(f"SELECT Id FROM Account WHERE Name = '{name.replace(chr(39), chr(92)+chr(39))}' LIMIT 1")
    if existing["totalSize"] > 0:
        aid = existing["records"][0]["Id"]
        sf.Account.update(aid, payload)
        print(f"  updated Account {aid} ({name})")
        return aid
    aid = sf.Account.create(payload)["id"]
    print(f"  created Account {aid} ({name})")
    return aid


def _upsert_task(sf, account_id: str, subject: str, description: str, status: str, activity_date: str, subtype: str = "Task"):
    """Find Task by Subject+AccountId; create or update.

    TaskSubtype is intentionally omitted — it's read-only on standard orgs and
    auto-derived from how the Task is created.
    """
    escaped = subject.replace("'", "\\'")
    existing = sf.query(
        f"SELECT Id FROM Task WHERE WhatId = '{account_id}' AND Subject = '{escaped}' LIMIT 1"
    )
    payload = {
        "Subject": subject,
        "Description": description,
        "WhatId": account_id,
        "Status": status,
        "ActivityDate": activity_date,
    }
    if existing["totalSize"] > 0:
        tid = existing["records"][0]["Id"]
        sf.Task.update(tid, payload)
    else:
        sf.Task.create(payload)


def _upsert_opportunity(sf, account_id: str, name: str, amount, close_date: str, stage: str, description: str):
    escaped = name.replace("'", "\\'")
    existing = sf.query(
        f"SELECT Id FROM Opportunity WHERE AccountId = '{account_id}' AND Name = '{escaped}' LIMIT 1"
    )
    payload = {
        "Name": name,
        "AccountId": account_id,
        "StageName": stage or "Prospecting",
        "CloseDate": close_date,
        "Description": description,
    }
    if amount is not None:
        payload["Amount"] = amount
    if existing["totalSize"] > 0:
        oid = existing["records"][0]["Id"]
        sf.Opportunity.update(oid, payload)
    else:
        sf.Opportunity.create(payload)


def main():
    if not is_configured():
        print("ERROR: Salesforce env vars missing. See .env.example and SALESFORCE_SETUP.md.")
        sys.exit(1)
    sf = get_sf()
    print(f"Connected to Salesforce instance https://{sf.sf_instance}")

    clients = pd.read_csv(DATA_DIR / "clients.csv")
    notes = pd.read_csv(DATA_DIR / "crm_notes.csv")
    goals = pd.read_csv(DATA_DIR / "client_goals.csv")
    compliance = pd.read_csv(DATA_DIR / "compliance_considerations.csv")

    client_id_to_account_id = {}

    print("\n=== Accounts ===")
    for _, row in clients.iterrows():
        aid = _upsert_account(sf, row.to_dict())
        client_id_to_account_id[row["client_id"]] = aid

    print("\n=== Tasks from CRM notes (Completed) ===")
    for _, row in notes.iterrows():
        aid = client_id_to_account_id.get(row["client_id"])
        if not aid:
            continue
        _upsert_task(
            sf,
            account_id=aid,
            subject=f"[{row.get('note_type','Note')}] {row['summary']}",
            description=row.get("details", ""),
            status="Completed",
            activity_date=str(row.get("note_date", date.today().isoformat()))[:10],
        )
    print(f"  upserted {len(notes)} note tasks")

    print("\n=== Opportunities from client goals ===")
    stage_map = {
        "On track": "Qualification",
        "In progress - exploring options": "Prospecting",
        "Active": "Qualification",
        "Monitoring": "Prospecting",
        "Planning phase": "Needs Analysis",
        "Not started": "Prospecting",
    }
    for _, row in goals.iterrows():
        aid = client_id_to_account_id.get(row["client_id"])
        if not aid:
            continue
        _upsert_opportunity(
            sf,
            account_id=aid,
            name=row["goal_name"],
            amount=_parse_amount(row.get("target_amount")),
            close_date=_horizon_to_close_date(str(row.get("time_horizon", ""))),
            stage=stage_map.get(str(row.get("status", "")).strip(), "Prospecting"),
            description=f"Priority: {row.get('priority','')} | Horizon: {row.get('time_horizon','')} | Status: {row.get('status','')}",
        )
    print(f"  upserted {len(goals)} goal opportunities")

    print("\n=== Tasks from compliance considerations (Open) ===")
    for _, row in compliance.iterrows():
        aid = client_id_to_account_id.get(row["client_id"])
        if not aid:
            continue
        deadline = str(row.get("deadline", "")).strip()
        try:
            activity_date = pd.to_datetime(deadline).date().isoformat()
        except Exception:
            activity_date = (date.today() + timedelta(days=30)).isoformat()
        _upsert_task(
            sf,
            account_id=aid,
            subject=f"[COMPLIANCE] {row.get('consideration_type','')}: {row.get('description','')[:80]}",
            description=f"Action required: {row.get('action_required','')}\nDeadline note: {deadline}",
            status="Not Started",
            activity_date=activity_date,
        )
    print(f"  upserted {len(compliance)} compliance tasks")

    print("\nDone. Account Id map:")
    for k, v in client_id_to_account_id.items():
        print(f"  {k} -> {v}")


if __name__ == "__main__":
    main()
