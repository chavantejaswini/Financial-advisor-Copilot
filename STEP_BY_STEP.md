# Step-by-Step: Advisor Meeting Prep Copilot

## Overview

This prototype implements an **AI Advisor Copilot** with three agents (Access → Connection → Summary) and two UI options:

- **React + TypeScript frontend + FastAPI backend (recommended):** production-style look/feel, one deployable service (API + static UI).
- **Streamlit app (legacy):** quick demo UI, still available.

---

## Step 1: Environment setup

1. **Python 3.9+**  
   Ensure Python is installed.

2. **Create a virtual environment (recommended):**
   ```bash
   cd /Users/tejaswinichavan/AIadvisor
   python3 -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure OpenAI:**
   - Copy `.env.example` to `.env`.
   - Set `OPENAI_API_KEY` to your API key.
   - Optional: set `OPENAI_BASE_URL` if you use a custom endpoint (e.g. Azure or proxy).
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY (and OPENAI_BASE_URL if needed)
   ```

---

## Step 2: Understand the data (mock CSVs)

The **Access Agent** reads from the `data/` folder. Mock files are provided:

| File | Purpose |
|------|--------|
| `clients.csv` | Client profile, risk tolerance, AUM band, advisor notes |
| `crm_notes.csv` | Meeting/call/email history and follow-ups |
| `portfolio_activity.csv` | Holdings, allocation, YTD change, alerts |
| `market_updates.csv` | Market and regulatory headlines |
| `client_goals.csv` | Goals, time horizons, status |
| `compliance_considerations.csv` | Suitability, disclosure, documentation items |

Sample clients: **C001** (Jennifer Martinez), **C002** (Robert Chen), **C003** (Sarah Williams).  
You can edit these CSVs or add new rows to demo different scenarios.

---

## Step 3: Run the copilot (recommended UI: React + TypeScript + FastAPI)

### 3A) Local development (two terminals)

```bash
# Terminal 1 (API)
uvicorn api.main:app --reload --port 8001

# Terminal 2 (frontend)
cd frontend
npm install
npm run dev
```

Then:

1. Open `http://localhost:5173`.
2. In the sidebar, **select a client** (e.g. `C001`, `C002`, `C003`).
3. Optionally add **additional notes** for this meeting.
4. Choose **Model** (e.g. `gpt-4o-mini` for speed, `gpt-4o` for higher quality).
5. Click **Generate meeting prep**.

The app runs:

- **Access Agent** → loads client data from CSVs.
- **Connection Agent** → finds relationships between profile, portfolio, goals, market, compliance.
- **Summary Agent** → produces the meeting prep.

Output appears in tabs: **Meeting prep** (summary, signals, risks/opportunities, discussion topics, next-best actions, human-review notes), **Relationships**, and **Raw context**.

### 3B) Streamlit UI (legacy)

From the project root:

```bash
streamlit run app/streamlit_app.py
```

Open the URL shown in the terminal (typically `http://localhost:8501`), then select a client and click **Generate meeting prep**.

---

## Step 4: What each agent does

| Agent | Role | Input | Output |
|-------|------|--------|--------|
| **Access** | Get all relevant data | Client ID, `data/` path | Client profile, CRM notes, portfolio, goals, compliance, market updates |
| **Connection** | Link contexts | Access Agent output | List of relationships (e.g. goal vs portfolio, market vs holdings, compliance vs topics) |
| **Summary** | Meeting prep | Access + Connection | Client summary, signals, risks/opportunities, discussion topics, next-best actions, confidence/human-review notes |

---

## Step 5: Demo flow (live demo)

1. Start Streamlit (Step 3).
2. Select **Jennifer Martinez (C001)**.
3. Click **Generate meeting prep**.
4. Show the **Meeting prep** tab: summary, signals, discussion topics, next-best actions.
5. Show **Relationships** to illustrate how the Connection Agent tied data together.
6. Optionally switch to **C002** or **C003** and regenerate to show consistency.

---

## Step 6: Optional extensions

- **Custom endpoint:** Set `OPENAI_BASE_URL` in `.env` to point to your OpenAI-compatible API.
- **More data:** Add rows to the CSVs or new CSV files and extend `access_agent.py` to load them.
- **Extra context:** Use the “Additional notes” field in the UI; a future enhancement could inject this into the Summary Agent prompt.

---

## File structure

```
AIadvisor/
├── .env                    # Your API key (create from .env.example)
├── .env.example
├── requirements.txt
├── STEP_BY_STEP.md        # This guide
├── STAKEHOLDER_SLIDE.html # One-slide business pitch
├── api/                   # FastAPI backend (/api/clients, /api/prep)
├── frontend/              # React + TypeScript + Tailwind UI
├── data/                  # Mock CSV data
│   ├── clients.csv
│   ├── crm_notes.csv
│   ├── portfolio_activity.csv
│   ├── market_updates.csv
│   ├── client_goals.csv
│   └── compliance_considerations.csv
├── agents/
│   ├── access_agent.py    # Load CSV data
│   ├── connection_agent.py# Relationships between contexts
│   ├── summary_agent.py   # Meeting prep summary
│   └── llm_client.py      # OpenAI client
└── app/
    ├── pipeline.py        # Access → Connection → Summary
    └── streamlit_app.py   # Streamlit UI
```

---

## Troubleshooting

- **“Set OPENAI_API_KEY”:** Create `.env` with `OPENAI_API_KEY=sk-...` (and optional `OPENAI_BASE_URL`).
- **Import errors:** Run `streamlit run app/streamlit_app.py` from the **project root** (`AIadvisor/`).
- **Client not found:** Use a client ID that exists in `data/clients.csv` (e.g. C001, C002, C003).
