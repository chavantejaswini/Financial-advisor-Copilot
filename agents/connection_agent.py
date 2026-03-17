"""
Connection Agent: Responsible for creating relationships between contexts.
Takes Access Agent output and identifies how client profile, portfolio, goals, market, and compliance connect.
"""

import json
from .llm_client import chat_completion


def _context_to_text(ctx: dict) -> str:
    """Serialize client context into a readable text block for the LLM."""
    parts = []
    if ctx.get("client_profile"):
        parts.append("CLIENT PROFILE:\n" + json.dumps(ctx["client_profile"], indent=2))
    if ctx.get("crm_notes"):
        parts.append("CRM NOTES:\n" + json.dumps(ctx["crm_notes"], indent=2))
    if ctx.get("portfolio_activity"):
        parts.append("PORTFOLIO ACTIVITY:\n" + json.dumps(ctx["portfolio_activity"], indent=2))
    if ctx.get("client_goals"):
        parts.append("CLIENT GOALS:\n" + json.dumps(ctx["client_goals"], indent=2))
    if ctx.get("compliance_considerations"):
        parts.append("COMPLIANCE:\n" + json.dumps(ctx["compliance_considerations"], indent=2))
    if ctx.get("market_updates"):
        parts.append("MARKET UPDATES:\n" + json.dumps(ctx["market_updates"], indent=2))
    return "\n\n".join(parts) if parts else "No context available."


def run_connection_agent(client_context: dict, model: str = "gpt-4o-mini") -> dict:
    """
    Analyze client context and produce structured relationships:
    - links between goals and portfolio/actions
    - links between market updates and client holdings
    - links between compliance items and recommended topics
    - any cross-cutting themes (e.g. retirement + sequence risk + fixed income)
    """
    if client_context.get("error"):
        return {"error": client_context["error"], "relationships": []}

    text = _context_to_text(client_context)
    prompt = """You are a financial advisory assistant. Given the following client context (profile, CRM notes, portfolio, goals, compliance, market updates), identify and list clear RELATIONSHIPS between different pieces of information. For example:
- Which goals are supported or at risk by current portfolio or market conditions?
- Which market updates are most relevant to this client's holdings or goals?
- Which compliance items should influence what we discuss or recommend?
- Any recurring themes (e.g. retirement income, tax, ESG) that tie multiple data points together.

Respond with a JSON object containing a single key "relationships" which is a list of strings. Each string is one relationship in plain language (2-3 sentences), suitable for an advisor to use when preparing for a client meeting. Be concise and actionable."""

    messages = [
        {"role": "system", "content": "You output valid JSON only. No markdown code fences."},
        {"role": "user", "content": f"{prompt}\n\n---\n{text}"},
    ]

    raw_response = ""
    try:
        out = chat_completion(messages, model=model)
        raw_response = out
        out_clean = out.strip()
        if out_clean.startswith("```"):
            out_clean = out_clean.split("```")[1]
            if out_clean.startswith("json"):
                out_clean = out_clean[4:]
        data = json.loads(out_clean)
        return {"relationships": data.get("relationships", []), "raw_context_used": True}
    except Exception as e:
        return {"error": str(e), "relationships": [], "raw_response": raw_response}
