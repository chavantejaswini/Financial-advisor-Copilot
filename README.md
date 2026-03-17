# Advisor Meeting Prep Copilot

AI-powered copilot that helps financial advisors prepare for client meetings by synthesizing client context, portfolio and market data, goals, and compliance into a concise meeting prep with talking points and next-best actions.

## Quick start

1. **Install:** `pip install -r requirements.txt`
2. **Configure:** Copy `.env.example` to `.env` and set `OPENAI_API_KEY` (and optionally `OPENAI_BASE_URL` for your endpoint).
3. **Run:** From the project root, run:
   ```bash
   streamlit run app/streamlit_app.py
   ```
4. In the UI, select a client (e.g. Jennifer Martinez — C001) and click **Generate meeting prep**.

## Three agents

| Agent | Responsibility |
|-------|----------------|
| **Access** | Loads all client-related data from CSV sources (CRM, portfolio, market, goals, compliance). |
| **Connection** | Identifies relationships between contexts (e.g. goals vs portfolio, market vs holdings, compliance vs topics). |
| **Summary** | Produces the meeting prep: client summary, signals, risks/opportunities, discussion topics, next-best actions, and confidence/human-review notes. |

## Data

Mock CSV files in `data/` simulate CRM notes, portfolio activity, market updates, client goals, and compliance. Edit or extend them for demos. See `STEP_BY_STEP.md` for details.

## Deliverables

- **Working prototype:** Streamlit app + three-agent pipeline, demoable live.
- **Step-by-step guide:** `STEP_BY_STEP.md`
- **Stakeholder slide:** `STAKEHOLDER_SLIDE.html` — open in a browser to present the business pitch.

## Constraints (as per problem statement)

- Prototype is demo-ready, not production-ready.
- Enterprise data integrations are simulated via CSV; replace with real APIs when available.
- Human advisor stays in control; the copilot separates facts, assumptions, and recommendations and surfaces areas for human review.
