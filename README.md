# Advisor Meeting Prep Copilot

A financial-advisor copilot that prepares for client meetings AND executes CRM actions on natural-language commands. Built as a **3-agent LangChain pipeline with live Salesforce CRM + SOQL integration**, with an optional **Agentforce API** bridge that invokes a custom SF-native Agent in parallel.

The frontend is an **enterprise-grade React + TypeScript workspace** (Salesforce Lightning / Linear / Notion feel) with a Dashboard, Client Workspace, Meeting Prep, Calendar, and a live Meeting Room. Every AI output is attributed to the agent that produced it and carries a confidence score plus Approve / Flag / Modify controls — the advisor stays in control, and nothing is final without sign-off.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│ React + TypeScript UI (Vite)  →  FastAPI  →  3-agent LangChain pipeline  │
│                                                                          │
│   Access Agent   ──── SOQL ───►  Salesforce (Account / Task / Opp)       │
│      │             (CSV fallback when SF env vars are absent)            │
│      ▼                                                                   │
│   Connection Agent  (LCEL: prompt | LLM | JSON parser)                   │
│      │                                                                   │
│      ▼                                                                   │
│   Summary Agent  (tool-calling agent)                                    │
│      ├── tools: soql_query, get_account_summary,                         │
│      │          create_followup_task, log_meeting_note  ◄── live SF      │
│      └── (optional) Agentforce API ────► custom SF-native Agent          │
└──────────────────────────────────────────────────────────────────────────┘
```

The Summary Agent takes the advisor's natural-language note (e.g. *"create a task to send the ESG comparison by Friday"*) and either calls a CRM tool itself (LangChain path) or routes the same instruction to a real Agentforce agent in your SF org (hybrid path). The UI surfaces both responses for side-by-side comparison.

## Three deployment modes

| Mode | What runs | Required env |
|------|-----------|--------------|
| **CSV fallback** | LangChain pipeline reads `data/*.csv`. No SF needed. | `OPENAI_API_KEY` |
| **Salesforce live** | LangChain pipeline reads from SF via SOQL; CRM tools create real Tasks. | `OPENAI_API_KEY`, `SF_*` |
| **Hybrid (Agentforce)** | Same as above + a custom Agentforce Agent is invoked via the Agentforce API on every advisor note. | `OPENAI_API_KEY`, `SF_*`, `AGENTFORCE_*` |

See [SALESFORCE_SETUP.md](SALESFORCE_SETUP.md) for the full Agentforce Developer Edition signup, Connected App, Apex action, and Agent creation walkthrough.

## Quick start

### One command (recommended)

```bash
pip install -r requirements.txt        # first time only
cp .env.example .env                   # set OPENAI_API_KEY (+ optional SF_*/AGENTFORCE_*)
./scripts/dev.sh
```

[`scripts/dev.sh`](scripts/dev.sh) starts the FastAPI backend (`:8001`) and the Vite frontend (`:5173`) together, frees any stale ports first, runs `npm install` on first run, and stops **both** cleanly on `Ctrl+C`. Open `http://localhost:5173`.

Override ports if needed: `BACKEND_PORT=9000 FRONTEND_PORT=3000 ./scripts/dev.sh`.

### Manual (two terminals)

1. `pip install -r requirements.txt`
2. `cd frontend && npm install && cd ..`
3. `cp .env.example .env` — set `OPENAI_API_KEY`. Optionally fill in `SF_*` and `AGENTFORCE_*` (see [SALESFORCE_SETUP.md](SALESFORCE_SETUP.md)).
4. Terminal 1: `uvicorn api.main:app --reload --port 8001`
5. Terminal 2: `cd frontend && npm run dev`
6. Open `http://localhost:5173`, hit `GET /api/health` to confirm which mode you're in.

### Docker

```bash
docker build -t advisor-copilot .
docker run -p 8501:8501 \
  -e OPENAI_API_KEY=sk-... \
  -e SF_USERNAME=... -e SF_PASSWORD=... -e SF_SECURITY_TOKEN=... \
  advisor-copilot
```

### Streamlit (legacy)

```bash
streamlit run app/streamlit_app.py
```

## Three agents

| Agent | Implementation | Responsibility |
|-------|----------------|----------------|
| **Access** | SOQL via `simple-salesforce` (CSV fallback) | Pull Account + Contacts + Tasks + Opportunities for the selected client. |
| **Connection** | LangChain LCEL chain | Identify cross-cutting relationships (goals ↔ portfolio, market ↔ holdings, compliance ↔ topics). |
| **Summary** | LangChain `create_tool_calling_agent` with CRM tools | Produce the meeting-prep brief AND execute any CRM actions the advisor requested in plain language. Optionally also fans the request out to Agentforce. |

## Frontend — enterprise UI

A React + TypeScript + Tailwind workspace (Vite) inside an app shell with a collapsible sidebar, top bar, breadcrumbs, a ⌘K command palette, notifications, and a responsive mobile drawer.

| Screen | What it does | Data |
|--------|--------------|------|
| **Dashboard** | Day-at-a-glance: today's schedule, clients needing attention, AI actions to approve, connection health, quick stats. | Live (`/api/health`, client count) + sample |
| **Meeting Prep** | Runs the pipeline with a live Access → Connection → Summary status strip; renders the brief as per-section AI cards and a CRM Action Center with full audit trail. | Live `/api/prep` |
| **Client Workspace** | 360° client view — profile, portfolio snapshot, goals (Opportunities), activity timeline, open tasks, and AI insights — across Overview / Activity / AI Insights tabs. | Live `/api/prep` + sample portfolio |
| **Calendar** | Week grid of meetings; click to prep or join. | Sample |
| **Meeting Room** | Live in-meeting copilot: streaming transcription, real-time detected goals / concerns / suggested questions, and a post-meeting summary with proposed CRM updates to approve. | Sample |

**Human-in-the-loop & trust.** Every AI-generated card shows the agent, a confidence score, a timestamp, and Approve / Flag / Modify controls. CRM write actions surface the tool call, arguments, Salesforce response, a deep link to the created record, and a sign-off / flag-for-reversal decision. Live data is unmarked; any simulated data is tagged with a **`Sample data`** badge. Accessibility: WCAG-minded focus states, keyboard nav, a skip link, `aria-live` transcript, and `prefers-reduced-motion` support.

## API endpoints

- `GET /api/health` — which backends are live (OpenAI / Salesforce / Agentforce).
- `GET /api/clients` — client list (Accounts from Salesforce when configured, else CSV rows).
- `POST /api/prep` — runs the pipeline. Body: `{ client_id, model?, notes? }`. Returns `summary_output.actions_taken` (LangChain tool calls executed) and `summary_output.agentforce_response` (Agentforce reply when configured).

## Seeding Salesforce with demo data

```bash
python scripts/seed_salesforce.py
```

Upserts three demo Accounts, their CRM Tasks, and their financial goals as Opportunities. Idempotent — re-runs update by Name/Subject match instead of duplicating. See [scripts/seed_salesforce.py](scripts/seed_salesforce.py) for the schema mapping.

## Repository layout

```
agents/
  access_agent.py          SOQL-first, CSV fallback
  connection_agent.py      LangChain LCEL chain
  summary_agent.py         LangChain tool-calling agent + Agentforce fan-out
  crm_tools.py             LangChain @tool wrappers around the SF REST API
  salesforce_client.py     simple-salesforce singleton + is_configured()
  agentforce_client.py     OAuth + Agentforce API session/messages calls
  llm_client.py            Legacy raw OpenAI client (kept for the Streamlit UI)
api/main.py                FastAPI: /api/health, /api/clients, /api/prep
app/pipeline.py            Orchestrator: Access → Connection → Summary
scripts/
  dev.sh                   One-command launcher: backend + frontend together
  seed_salesforce.py       CSV → SF Accounts/Tasks/Opportunities seed
salesforce/
  apex/                    CreateFollowUpTaskAction (Agent Action backing class)
  prompts/                 Topic spec to paste into Setup → Agents
data/*.csv                 Mock fixtures used by the CSV fallback path
frontend/                  React + TypeScript UI (Vite)
  src/components/          App shell, UI primitives, agent/AI/CRM components
  src/screens/             Dashboard, MeetingPrep, Clients, Calendar, MeetingRoom
  src/lib/                 API client, formatters, clearly-tagged demo data
SALESFORCE_SETUP.md        End-to-end Agentforce setup walkthrough
DEPLOY.md                  Docker / Railway / Render notes
```

## Constraints

- Prototype is demo-ready, not production-ready. Auth uses username-password OAuth — swap to JWT-bearer for anything real.
- Custom objects aren't deployed; `risk_tolerance` / `aum_band` are stored in `Account.Description` as a tiny JSON blob to keep the org zero-customization.
- Agentforce Developer Edition has limited Einstein credits — fine for a portfolio demo, not for stress-testing.
- Human advisor stays in control: every action surfaced in the UI shows the tool call, args, and result so it's auditable.
