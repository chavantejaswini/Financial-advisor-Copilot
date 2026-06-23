"""
Connection Agent: identifies cross-cutting relationships in the client context.

Implemented as a LangChain LCEL chain (prompt | llm | JsonOutputParser) so the wiring
matches the rest of the pipeline. Output shape is unchanged from the original CSV
implementation — the downstream Summary Agent doesn't need to care.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Optional

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

logger = logging.getLogger(__name__)


# Kept as a module-level helper because the Summary Agent reuses it to flatten context
# into the prompt body without re-importing pandas.
def _context_to_text(ctx: dict) -> str:
    parts = []
    if ctx.get("client_profile"):
        parts.append("CLIENT PROFILE:\n" + json.dumps(ctx["client_profile"], indent=2, default=str))
    if ctx.get("crm_notes"):
        parts.append("CRM NOTES:\n" + json.dumps(ctx["crm_notes"], indent=2, default=str))
    if ctx.get("open_tasks"):
        parts.append("OPEN TASKS:\n" + json.dumps(ctx["open_tasks"], indent=2, default=str))
    if ctx.get("portfolio_activity"):
        parts.append("PORTFOLIO ACTIVITY:\n" + json.dumps(ctx["portfolio_activity"], indent=2, default=str))
    if ctx.get("client_goals"):
        parts.append("CLIENT GOALS:\n" + json.dumps(ctx["client_goals"], indent=2, default=str))
    if ctx.get("compliance_considerations"):
        parts.append("COMPLIANCE:\n" + json.dumps(ctx["compliance_considerations"], indent=2, default=str))
    if ctx.get("market_updates"):
        parts.append("MARKET UPDATES:\n" + json.dumps(ctx["market_updates"], indent=2, default=str))
    return "\n\n".join(parts) if parts else "No context available."


_SYSTEM = (
    "You are a financial advisory assistant. You output valid JSON only — no markdown, "
    "no code fences. You return an object with a single key 'relationships' which is a "
    "list of plain-language strings (2-3 sentences each) connecting goals to portfolio/market, "
    "market to holdings, compliance to topics, and cross-cutting themes."
)

_USER = (
    "Given the following client context, identify clear RELATIONSHIPS between different "
    "pieces of information. Be concise and actionable.\n\n---\n{context}"
)


def _llm(model: str) -> ChatOpenAI:
    return ChatOpenAI(
        model=model,
        temperature=0.3,
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_BASE_URL") or None,
    )


def run_connection_agent(client_context: dict, model: str = "gpt-4o-mini") -> dict:
    if client_context.get("error"):
        return {"error": client_context["error"], "relationships": []}

    prompt = ChatPromptTemplate.from_messages([("system", _SYSTEM), ("user", _USER)])
    chain = prompt | _llm(model) | JsonOutputParser()

    try:
        data = chain.invoke({"context": _context_to_text(client_context)})
        return {"relationships": data.get("relationships", []), "source": client_context.get("source")}
    except Exception as e:
        logger.exception("Connection agent failed")
        return {"error": str(e), "relationships": []}
