"""
Access Agent: Responsible for accessing all current data from CSV sources.
Loads and normalizes client profile, CRM notes, portfolio, market, goals, and compliance data.
"""

import os
import pandas as pd
from pathlib import Path


DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def load_all_data(data_dir: Path = None) -> dict:
    """
    Load all CSV data sources into a single structured dict.
    Returns dict with keys: clients, crm_notes, portfolio_activity, market_updates, client_goals, compliance.
    """
    base = data_dir or DATA_DIR
    result = {}

    files = {
        "clients": "clients.csv",
        "crm_notes": "crm_notes.csv",
        "portfolio_activity": "portfolio_activity.csv",
        "market_updates": "market_updates.csv",
        "client_goals": "client_goals.csv",
        "compliance_considerations": "compliance_considerations.csv",
    }

    for key, filename in files.items():
        path = base / filename
        if path.exists():
            result[key] = pd.read_csv(path)
        else:
            result[key] = pd.DataFrame()

    return result


def get_client_context(client_id: str, data_dir: Path = None) -> dict:
    """
    Get all data relevant to a specific client for meeting prep.
    Access Agent output: unified client-specific context from all sources.
    """
    raw = load_all_data(data_dir)

    clients = raw.get("clients", pd.DataFrame())
    client_row = clients[clients["client_id"] == client_id]
    if client_row.empty:
        return {"error": f"Client {client_id} not found", "raw": raw}

    client_profile = client_row.iloc[0].to_dict()

    crm = raw.get("crm_notes", pd.DataFrame())
    crm_client = crm[crm["client_id"] == client_id] if not crm.empty else pd.DataFrame()

    portfolio = raw.get("portfolio_activity", pd.DataFrame())
    portfolio_client = portfolio[portfolio["client_id"] == client_id] if not portfolio.empty else pd.DataFrame()

    goals = raw.get("client_goals", pd.DataFrame())
    goals_client = goals[goals["client_id"] == client_id] if not goals.empty else pd.DataFrame()

    compliance = raw.get("compliance_considerations", pd.DataFrame())
    compliance_client = compliance[compliance["client_id"] == client_id] if not compliance.empty else pd.DataFrame()

    market = raw.get("market_updates", pd.DataFrame())

    return {
        "client_id": client_id,
        "client_profile": client_profile,
        "crm_notes": crm_client.to_dict("records") if not crm_client.empty else [],
        "portfolio_activity": portfolio_client.to_dict("records") if not portfolio_client.empty else [],
        "client_goals": goals_client.to_dict("records") if not goals_client.empty else [],
        "compliance_considerations": compliance_client.to_dict("records") if not compliance_client.empty else [],
        "market_updates": market.to_dict("records") if not market.empty else [],
    }
