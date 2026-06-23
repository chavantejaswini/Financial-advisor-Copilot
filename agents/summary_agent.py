"""
Summary Agent: produces the meeting-prep brief AND executes any CRM actions the
advisor requested in natural language.

Architecture:
  - LangChain 1.x `create_agent` graph with the CRM tools from crm_tools.py bound.
  - System prompt forces a final JSON envelope containing meeting prep + actions_taken.
  - When AGENTFORCE_AGENT_ID is set, the same advisor note is ALSO sent to a real
    Agentforce agent in the SF org; both responses are returned so the UI can show
    the hybrid execution side-by-side.
"""

from __future__ import annotations

import json
import logging
import os
from datetime import date
from typing import Optional

from langchain.agents import create_agent
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from langchain_openai import ChatOpenAI

from .agentforce_client import invoke_agent as agentforce_invoke
from .agentforce_client import is_configured as agentforce_configured
from .connection_agent import _context_to_text, run_connection_agent
from .crm_tools import ALL_TOOLS
from .salesforce_client import is_configured as sf_configured

logger = logging.getLogger(__name__)


_EMPTY_SUMMARY = {
    "client_summary": "",
    "key_financial_or_relationship_signals": [],
    "potential_risks_or_opportunities": [],
    "suggested_discussion_topics": [],
    "recommended_next_best_actions": [],
    "confidence_notes_or_human_review": [],
}


_SYSTEM_PROMPT = """You are an AI advisor copilot helping a human financial advisor \
prepare for an upcoming client meeting AND act on the advisor's natural-language \
instructions against the Salesforce CRM.

You have CRM tools available:
  - soql_query: read-only SOQL.
  - get_account_summary: pull Account + Contacts + recent Tasks + Opportunities.
  - create_followup_task: create a follow-up Task on a client's Account.
  - log_meeting_note: log a completed Task representing a meeting/call note.

Workflow:
  1. Read the client context and identified relationships in the user turn.
  2. If the advisor's note contains an explicit action ("create a task", "remind me", \
     "log a note", "schedule follow-up", "set up a reminder"), CALL the appropriate \
     CRM tool. Use the client's name from the profile when binding the action.
  3. Then produce a meeting-prep brief.

You MUST end your turn by emitting a single JSON object (no markdown, no code fences) \
with EXACTLY these keys:
  - "client_summary": string (2-4 sentences)
  - "key_financial_or_relationship_signals": list[string] (3-6 items)
  - "potential_risks_or_opportunities": list[string] (2-5 items)
  - "suggested_discussion_topics": list[string] (4-8 items)
  - "recommended_next_best_actions": list[string] (2-5 items)
  - "confidence_notes_or_human_review": list[string] (places the advisor must verify)

Keep the human in control: separate facts from assumptions. Be concise."""


_USER_TEMPLATE = """TODAY'S DATE: {today}

CLIENT CONTEXT (source: {source}):
{context}

IDENTIFIED RELATIONSHIPS:
{relationships}

ADVISOR'S NATURAL-LANGUAGE NOTE (may contain action requests):
{advisor_note}

Produce the JSON brief, calling CRM tools first for any explicit actions in the note.
When the advisor mentions a relative day ("Friday", "next week", "tomorrow"), resolve it
against TODAY'S DATE above before passing to the tool."""


def _llm(model: str) -> ChatOpenAI:
    return ChatOpenAI(
        model=model,
        temperature=0.2,
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_BASE_URL") or None,
    )


def _parse_json_envelope(text: str) -> dict:
    """Strip code-fence garbage and parse the agent's final JSON output."""
    s = (text or "").strip()
    if s.startswith("```"):
        s = s.split("```", 2)[1]
        if s.startswith("json"):
            s = s[4:]
        s = s.rsplit("```", 1)[0]
    try:
        return json.loads(s.strip())
    except json.JSONDecodeError:
        return {}


def _actions_from_messages(messages: list) -> list[dict]:
    """Walk the message thread and pair each AIMessage tool_call with its ToolMessage result."""
    actions = []
    tool_calls_by_id: dict[str, dict] = {}
    for msg in messages:
        if isinstance(msg, AIMessage):
            for tc in (getattr(msg, "tool_calls", None) or []):
                tool_calls_by_id[tc.get("id", "")] = {
                    "tool": tc.get("name", "unknown"),
                    "input": tc.get("args", {}),
                    "result": None,
                }
        elif isinstance(msg, ToolMessage):
            tcid = getattr(msg, "tool_call_id", "")
            content = msg.content if isinstance(msg.content, str) else str(msg.content)
            if tcid in tool_calls_by_id:
                tool_calls_by_id[tcid]["result"] = content
            else:
                actions.append({"tool": getattr(msg, "name", "unknown"), "input": {}, "result": content})
    actions.extend(tool_calls_by_id.values())
    return actions


def run_summary_agent(
    client_context: dict,
    connection_output: Optional[dict] = None,
    model: str = "gpt-4o-mini",
    advisor_note: Optional[str] = None,
) -> dict:
    if client_context.get("error"):
        return {"error": client_context["error"]}

    if connection_output is None:
        connection_output = run_connection_agent(client_context, model=model)

    relationships = connection_output.get("relationships", [])
    rel_text = "\n".join(f"- {r}" for r in relationships) if relationships else "(none identified)"
    context_text = _context_to_text(client_context)
    client_name = (client_context.get("client_profile") or {}).get("client_name", "Client")
    note = (advisor_note or "").strip() or "(no advisor note provided)"

    # Respect CRM_BACKEND=csv: when the read path is forced to CSV, also disable SF writes
    # so an offline demo can't accidentally create Tasks in a configured org.
    forced_backend = (os.getenv("CRM_BACKEND") or "").lower()
    with_tools = sf_configured() and forced_backend != "csv"
    tools = ALL_TOOLS if with_tools else []
    agent = create_agent(_llm(model), tools=tools, system_prompt=_SYSTEM_PROMPT)

    user_text = _USER_TEMPLATE.format(
        today=date.today().isoformat(),
        source=client_context.get("source", "csv"),
        context=context_text,
        relationships=rel_text,
        advisor_note=note,
    )

    result_text = ""
    messages: list = []
    try:
        state = agent.invoke({"messages": [HumanMessage(content=user_text)]})
        messages = state.get("messages", [])
        # Final answer is the last AIMessage with no pending tool calls
        for m in reversed(messages):
            if isinstance(m, AIMessage) and not getattr(m, "tool_calls", None):
                result_text = m.content if isinstance(m.content, str) else str(m.content)
                break
    except Exception as e:
        logger.exception("Summary agent execution failed")
        return {
            **_EMPTY_SUMMARY,
            "client_name": client_name,
            "client_id": client_context.get("client_id", ""),
            "error": str(e),
            "actions_taken": [],
            "agentforce_response": None,
            "mode": "salesforce" if with_tools else "csv-fallback",
        }

    parsed = _parse_json_envelope(result_text)
    summary = {**_EMPTY_SUMMARY, **{k: parsed.get(k, _EMPTY_SUMMARY[k]) for k in _EMPTY_SUMMARY}}
    actions = _actions_from_messages(messages)

    # Hybrid: when Agentforce is configured AND the advisor note carries intent,
    # fan out to the real SF-native Agent so the UI can show both responses.
    agentforce_response = None
    if advisor_note and agentforce_configured() and forced_backend != "csv":
        af_message = (
            f"Client: {client_name} (Account Id: {client_context.get('client_id')}). "
            f"Advisor note: {advisor_note}"
        )
        agentforce_response = agentforce_invoke(af_message)

    return {
        **summary,
        "client_name": client_name,
        "client_id": client_context.get("client_id", ""),
        "actions_taken": actions,
        "agentforce_response": agentforce_response,
        "mode": "salesforce" if with_tools else "csv-fallback",
        "raw_response": result_text if not parsed else None,
    }
