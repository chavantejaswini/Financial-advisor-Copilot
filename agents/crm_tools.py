"""
LangChain tools that expose Salesforce CRM as callable functions for the Summary Agent.

The Summary Agent is a tool-calling agent — given an advisor's natural-language note
(e.g. "create a follow-up task for Jennifer to send ESG comparison by Friday"),
it picks one of these tools and emits a structured CRM action against the live org.

Tools are intentionally thin wrappers over SOQL / sObject CRUD so the LLM does the
intent → arguments mapping and the code does the deterministic CRM work.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from typing import Optional

from langchain_core.tools import tool

from .salesforce_client import get_sf, is_configured

logger = logging.getLogger(__name__)


# ---------- helpers ----------

def _require_sf():
    if not is_configured():
        raise RuntimeError("Salesforce not configured — set SF_USERNAME/SF_PASSWORD/SF_SECURITY_TOKEN.")
    return get_sf()


def _parse_due_date(s: Optional[str]) -> str:
    """Coerce assorted natural-language date hints to an ISO date string Salesforce accepts."""
    if not s:
        return (date.today() + timedelta(days=7)).isoformat()
    s = s.strip().lower()
    today = date.today()
    if s in {"today"}:
        return today.isoformat()
    if s in {"tomorrow"}:
        return (today + timedelta(days=1)).isoformat()
    weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for i, name in enumerate(weekdays):
        if name in s:
            delta = (i - today.weekday()) % 7
            delta = delta or 7  # "Friday" said on a Friday → next Friday
            return (today + timedelta(days=delta)).isoformat()
    try:
        return datetime.fromisoformat(s).date().isoformat()
    except ValueError:
        return (today + timedelta(days=7)).isoformat()


def _find_account_id(name_or_id: str) -> Optional[str]:
    """Look up an Account by exact Id, External_Id__c, or fuzzy Name match."""
    sf = _require_sf()
    val = (name_or_id or "").strip()
    if not val:
        return None
    # exact Salesforce 15/18-char Id
    if len(val) in (15, 18) and val.replace("0", "").isalnum():
        try:
            rec = sf.Account.get(val)
            if rec:
                return rec["Id"]
        except Exception:
            pass
    escaped = val.replace("'", "\\'")
    soql = f"SELECT Id, Name FROM Account WHERE Name LIKE '%{escaped}%' LIMIT 1"
    res = sf.query(soql)
    if res.get("totalSize", 0) > 0:
        return res["records"][0]["Id"]
    return None


# ---------- tools exposed to the LLM ----------

@tool
def soql_query(query: str) -> str:
    """Execute a read-only SOQL query and return the JSON results.

    Use for ad-hoc lookups across Account, Contact, Task, Opportunity, etc.
    Example: "SELECT Id, Name FROM Account WHERE Name LIKE '%Martinez%' LIMIT 5"
    """
    import json
    sf = _require_sf()
    q = query.strip().rstrip(";")
    if not q.lower().startswith("select"):
        return json.dumps({"error": "Only SELECT queries are permitted via soql_query."})
    res = sf.query(q)
    return json.dumps({"totalSize": res.get("totalSize", 0), "records": res.get("records", [])}, default=str)


@tool
def get_account_summary(client_name_or_id: str) -> str:
    """Return Account + recent Contacts/Tasks/Opportunities for a client.

    client_name_or_id can be the Salesforce Id, External_Id__c, or a (partial) Name.
    """
    import json
    sf = _require_sf()
    account_id = _find_account_id(client_name_or_id)
    if not account_id:
        return json.dumps({"error": f"No Account found matching '{client_name_or_id}'"})

    account = sf.Account.get(account_id)
    contacts = sf.query(
        f"SELECT Id, Name, Email, Phone, Title FROM Contact WHERE AccountId = '{account_id}' LIMIT 10"
    )["records"]
    tasks = sf.query(
        "SELECT Id, Subject, Status, ActivityDate, Description "
        f"FROM Task WHERE AccountId = '{account_id}' ORDER BY ActivityDate DESC NULLS LAST LIMIT 10"
    )["records"]
    opps = sf.query(
        "SELECT Id, Name, StageName, Amount, CloseDate "
        f"FROM Opportunity WHERE AccountId = '{account_id}' ORDER BY CloseDate DESC LIMIT 10"
    )["records"]
    return json.dumps({"account": account, "contacts": contacts, "tasks": tasks, "opportunities": opps}, default=str)


@tool
def create_followup_task(
    client_name_or_id: str,
    subject: str,
    due_date: Optional[str] = None,
    description: Optional[str] = None,
    priority: str = "Normal",
) -> str:
    """Create a follow-up Task on a client's Account.

    Use when the advisor says things like "remind me to send the ESG comparison Friday"
    or "create a task to confirm the bond ladder review next week".
    due_date accepts ISO 'YYYY-MM-DD', "tomorrow", "friday", etc.
    """
    import json
    sf = _require_sf()
    account_id = _find_account_id(client_name_or_id)
    if not account_id:
        return json.dumps({"error": f"No Account found matching '{client_name_or_id}'"})
    payload = {
        "Subject": subject,
        "WhatId": account_id,
        "ActivityDate": _parse_due_date(due_date),
        "Status": "Not Started",
        "Priority": priority if priority in {"Low", "Normal", "High"} else "Normal",
        "Description": description or "",
    }
    res = sf.Task.create(payload)
    return json.dumps({"created": "Task", "id": res.get("id"), "payload": payload}, default=str)


@tool
def log_meeting_note(client_name_or_id: str, subject: str, body: str) -> str:
    """Log a meeting/call note against a client's Account as a completed Task.

    Use after a meeting to record what was discussed and any commitments.
    """
    import json
    sf = _require_sf()
    account_id = _find_account_id(client_name_or_id)
    if not account_id:
        return json.dumps({"error": f"No Account found matching '{client_name_or_id}'"})
    payload = {
        "Subject": subject,
        "WhatId": account_id,
        "ActivityDate": date.today().isoformat(),
        "Status": "Completed",
        "Description": body,
    }
    res = sf.Task.create(payload)
    return json.dumps({"created": "Task (meeting log)", "id": res.get("id"), "payload": payload}, default=str)


ALL_TOOLS = [soql_query, get_account_summary, create_followup_task, log_meeting_note]
