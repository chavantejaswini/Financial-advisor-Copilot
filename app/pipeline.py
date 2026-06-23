"""
Orchestrates Access -> Connection -> Summary for the Advisor Meeting Prep Copilot.

Threads the advisor's natural-language note through to the Summary Agent so it can
execute CRM actions (and optionally invoke Agentforce in parallel).
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agents.access_agent import get_client_context
from agents.connection_agent import run_connection_agent
from agents.summary_agent import run_summary_agent


def run_copilot(
    client_id: str,
    data_dir: Optional[Path] = None,
    model: str = "gpt-4o-mini",
    advisor_note: Optional[str] = None,
) -> dict:
    """Run Access → Connection → Summary; pass the advisor note to Summary for CRM actions."""
    data_dir = data_dir or (Path(__file__).resolve().parent.parent / "data")
    client_context = get_client_context(client_id, data_dir=data_dir)
    connection_output = run_connection_agent(client_context, model=model)
    summary_output = run_summary_agent(
        client_context,
        connection_output=connection_output,
        model=model,
        advisor_note=advisor_note,
    )
    return {
        "client_context": client_context,
        "connection_output": connection_output,
        "summary_output": summary_output,
    }
