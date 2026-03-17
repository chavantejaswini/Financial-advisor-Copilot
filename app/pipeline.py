"""
Orchestrates Access -> Connection -> Summary for the Advisor Meeting Prep Copilot.
"""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agents.access_agent import get_client_context
from agents.connection_agent import run_connection_agent
from agents.summary_agent import run_summary_agent


def run_copilot(client_id: str, data_dir: Path = None, model: str = "gpt-4o-mini") -> dict:
    """
    Run the full pipeline:
    1. Access Agent: load all client data from CSV
    2. Connection Agent: identify relationships between contexts
    3. Summary Agent: produce meeting prep output
    """
    data_dir = data_dir or (Path(__file__).resolve().parent.parent / "data")
    client_context = get_client_context(client_id, data_dir=data_dir)
    connection_output = run_connection_agent(client_context, model=model)
    summary_output = run_summary_agent(client_context, connection_output=connection_output, model=model)
    return {
        "client_context": client_context,
        "connection_output": connection_output,
        "summary_output": summary_output,
    }
