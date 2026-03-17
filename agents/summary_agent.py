"""
Summary Agent: Creates the meeting-prep summary and keeps information handy for advisors.
Consumes Access Agent output + Connection Agent relationships; produces structured meeting prep.
"""

import json
from .llm_client import chat_completion
from .connection_agent import _context_to_text, run_connection_agent


def run_summary_agent(client_context: dict, connection_output: dict = None, model: str = "gpt-4o-mini") -> dict:
    """
    Produce meeting-prep output:
    - client_summary
    - key_financial_or_relationship_signals
    - potential_risks_or_opportunities
    - suggested_discussion_topics
    - recommended_next_best_actions
    - confidence_notes_or_human_review
    """
    if client_context.get("error"):
        return {"error": client_context["error"]}

    if connection_output is None:
        connection_output = run_connection_agent(client_context, model=model)

    relationships = connection_output.get("relationships", [])
    rel_text = "\n".join(f"- {r}" for r in relationships) if relationships else "No structured relationships identified."

    context_text = _context_to_text(client_context)
    client_name = (client_context.get("client_profile") or {}).get("client_name", "Client")

    prompt = f"""You are an AI advisor copilot helping a human financial advisor prepare for an upcoming client meeting. Use the following information to produce a concise, actionable meeting prep.

CLIENT CONTEXT:
{context_text}

IDENTIFIED RELATIONSHIPS (from previous analysis):
{rel_text}

Produce a JSON object with exactly these keys (each value is a string or list of strings as specified):
- "client_summary": (string) Brief 2-4 sentence overview of the client situation and recent context.
- "key_financial_or_relationship_signals": (list of strings) 3-6 bullet-style signals (e.g. portfolio drift, recent life event, goal progress).
- "potential_risks_or_opportunities": (list of strings) 2-5 items: risks to address or opportunities to suggest.
- "suggested_discussion_topics": (list of strings) 4-8 concrete topics to cover in the meeting.
- "recommended_next_best_actions": (list of strings) 2-5 specific next steps (e.g. "Send ESG fund comparison by 3/20").
- "confidence_notes_or_human_review": (list of strings) Where the advisor should double-check or use judgment (e.g. "Recommendation depends on client's unknown tax situation").

Keep the human advisor in control: separate facts from assumptions and recommendations. Be concise. Output only valid JSON, no markdown."""

    messages = [
        {"role": "system", "content": "You output valid JSON only. No markdown code fences or extra text."},
        {"role": "user", "content": prompt},
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
        data["client_name"] = client_name
        data["client_id"] = client_context.get("client_id", "")
        return data
    except Exception as e:
        return {
            "error": str(e),
            "client_name": client_name,
            "client_summary": "",
            "key_financial_or_relationship_signals": [],
            "potential_risks_or_opportunities": [],
            "suggested_discussion_topics": [],
            "recommended_next_best_actions": [],
            "confidence_notes_or_human_review": [],
            "raw_response": raw_response,
        }
