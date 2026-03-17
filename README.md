# Advisor Meeting Prep Copilot

AI-powered copilot that helps financial advisors prepare for client meetings by synthesizing client context, portfolio and market data, goals, and compliance into a concise meeting prep with talking points and next-best actions.

## Quick start

This repo supports two UIs:

- **Production-style UI (recommended):** React + TypeScript frontend served by a FastAPI backend (single deployable service; used by the Dockerfile).
- **Legacy UI:** Streamlit app (still available for quick demos).

### Option A (recommended): React + TypeScript UI + FastAPI API (local dev)

1. **Python deps:** `pip install -r requirements.txt`
2. **Frontend deps:** `cd frontend && npm install`
3. **Configure:** `cp .env.example .env` then set `OPENAI_API_KEY` (and optionally `OPENAI_BASE_URL`)
4. **Run API (Terminal 1):**
   ```bash
   uvicorn api.main:app --reload --port 8001
   ```
5. **Run frontend (Terminal 2):**
   ```bash
   cd frontend
   npm run dev
   ```
6. Open `http://localhost:5173` and click **Generate meeting prep**.

### Option B: Docker (same as Railway)

```bash
docker build -t advisor-copilot .
docker run -p 8501:8501 -e OPENAI_API_KEY=sk-your-key advisor-copilot
```

Open `http://localhost:8501`.

For cloud deployment (Railway/Render/Fly), see `DEPLOY.md` (Docker section). Set `OPENAI_API_KEY` in the platform’s Variables/Secrets; the container binds to the platform-provided `PORT` automatically.

### Option C: Streamlit UI (legacy)

```bash
streamlit run app/streamlit_app.py
```

## Three agents

| Agent | Responsibility |
|-------|----------------|
| **Access** | Loads all client-related data from CSV sources (CRM, portfolio, market, goals, compliance). |
| **Connection** | Identifies relationships between contexts (e.g. goals vs portfolio, market vs holdings, compliance vs topics). |
| **Summary** | Produces the meeting prep: client summary, signals, risks/opportunities, discussion topics, next-best actions, and confidence/human-review notes. |

## Data

Mock CSV files in `data/` simulate CRM notes, portfolio activity, market updates, client goals, and compliance. Edit or extend them for demos. See `STEP_BY_STEP.md` for details.

## Deliverables

- **Working prototype:** Three-agent pipeline with a modern React/TypeScript UI (FastAPI) and a Streamlit UI (optional).
- **Step-by-step guide:** `STEP_BY_STEP.md`
- **Stakeholder slide:** `STAKEHOLDER_SLIDE.html` — open in a browser to present the business pitch.

## Constraints (as per problem statement)

- Prototype is demo-ready, not production-ready.
- Enterprise data integrations are simulated via CSV; replace with real APIs when available.
- Human advisor stays in control; the copilot separates facts, assumptions, and recommendations and surfaces areas for human review.
