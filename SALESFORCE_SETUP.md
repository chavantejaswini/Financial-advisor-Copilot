# Salesforce + Agentforce Setup

This app runs in three modes, in order of fidelity:

1. **CSV fallback** — no Salesforce required. The 3-agent pipeline reads local CSVs.
2. **Salesforce live** — `simple-salesforce` SOQL against your org's Accounts, Tasks, Opportunities. The Summary Agent's CRM tools (`create_followup_task`, `log_meeting_note`) run against the real org.
3. **Hybrid (Agentforce)** — same as #2, but additionally invokes a custom **Agentforce Agent** running inside your Salesforce org via the Agentforce API. The UI surfaces both the LangChain agent's actions and Agentforce's response side-by-side.

The sections below walk through full setup. If you only want to demo the LangChain side, stop after Section 3.

---

## 1. Sign up for Agentforce Developer Edition

Use the **Agentforce Developer Edition** signup (it comes with Agentforce features and Einstein credits already enabled). Plain Developer Edition will work for SOQL but not Agentforce.

- Signup: https://developer.salesforce.com/signup (look for the "Agentforce" or "AI Cloud" Dev Edition variant; also reachable via the Trailhead "Agentforce Trial" trailmix)
- Pick an org name + email. Salesforce will email a verification link and your username (`firstname.lastname@yourorg.org.com` style).
- Set your password.

## 2. Get your security token

simple-salesforce + the Agentforce OAuth flow both need a security token appended to your password.

1. Log into the org → click your avatar → **Settings** → **My Personal Information** → **Reset My Security Token**.
2. Salesforce emails the token to your account's email. Save it — you can't view it later, only reset.

## 3. Configure `.env`

Copy `.env.example` to `.env` and fill in:

```dotenv
OPENAI_API_KEY=sk-...

SF_USERNAME=you@example.org.com
SF_PASSWORD=your-password
SF_SECURITY_TOKEN=the-emailed-token
SF_DOMAIN=login

# Optional override; CSV is the default fallback when SF env vars are absent
CRM_BACKEND=salesforce
```

Verify by hitting `GET /api/health` once the API is running — it should show `salesforce_configured: true` with your instance URL.

## 4. Seed the org with the demo data

```bash
source venv/bin/activate
pip install -r requirements.txt
python scripts/seed_salesforce.py
```

This upserts three Accounts (Jennifer Martinez, Robert Chen, Sarah Williams), their CRM history as Tasks, and their goals as Opportunities. Re-runnable — it matches existing records by Name and updates rather than duplicating.

At this point you can demo Mode #2 (SF live, LangChain tools). To enable Mode #3 (Agentforce), continue below.

---

## 5. Deploy the Apex Agent Action

The custom action `CreateFollowUpTaskAction` lets your Agentforce agent create Tasks the same way the LangChain tool does.

Easiest path (org's built-in IDE):
1. In Setup, search "Apex Classes" → **New**.
2. Paste the contents of [salesforce/apex/CreateFollowUpTaskAction.cls](salesforce/apex/CreateFollowUpTaskAction.cls) → Save.

Or via sfdx/Salesforce CLI:
```bash
sf project deploy start --source-dir salesforce/apex
```

## 6. Create a Connected App (for the Agentforce API)

Setup → **App Manager** → **New Connected App** (use "Create a Connected App", not "External Client App"):

- **Name:** Advisor Copilot Bridge
- **API (Enable OAuth Settings):** check
- **Callback URL:** `http://localhost:8001/oauth/callback` (unused for username-password flow but required)
- **Selected OAuth Scopes:** `Manage user data via APIs (api)`, `Perform requests at any time (refresh_token, offline_access)`, `Access the Salesforce API Platform (sfap_api)`
- Save. Salesforce takes ~10 minutes to propagate.
- Open the Connected App → **Manage** → **Edit Policies** → set "Permitted Users" = "All users may self-authorize" and "IP Relaxation" = "Relax IP restrictions" (for local dev only — tighten before any real use).
- Back on the Connected App detail page, copy the **Consumer Key** and **Consumer Secret** into `.env`:

```dotenv
AGENTFORCE_CLIENT_ID=consumer-key-here
AGENTFORCE_CLIENT_SECRET=consumer-secret-here
```

## 7. Build the Agentforce Agent

Setup → **Agents** → **New Agent**.

- **Type:** Custom Agent
- **Name:** Advisor Meeting Prep Copilot
- **Topic 1:** paste the spec from [salesforce/prompts/AdvisorMeetingPrep.prompt.md](salesforce/prompts/AdvisorMeetingPrep.prompt.md)
- **Actions to enable:**
  - Standard: *Identify Record by Name* (scope: Account)
  - Standard: *Query Records* (scopes: Account, Task, Opportunity)
  - Custom: Add the `CreateFollowUpTaskAction` Apex action — Setup will surface it after you deploy the class.
- Activate the agent.
- Open the agent's detail page and copy the **Agent Id** (18 characters, starts with `0Xx`) into `.env`:

```dotenv
AGENTFORCE_AGENT_ID=0Xx...
AGENTFORCE_API_VERSION=v62.0
```

## 8. Smoke-test

```bash
source venv/bin/activate
uvicorn api.main:app --reload --port 8001
```

Then in another shell:

```bash
curl -s localhost:8001/api/health | jq
```

You should see all three booleans true.

Then drive the pipeline with an advisor note containing an action intent:

```bash
curl -s -X POST localhost:8001/api/prep \
  -H 'content-type: application/json' \
  -d '{"client_id":"<an-account-id-from-seed-output>","notes":"Create a task to send ESG fund comparison by Friday"}' | jq
```

Look for:
- `summary_output.actions_taken[0].tool == "create_followup_task"` — LangChain's tool fired.
- `summary_output.agentforce_response.reply` — the real Agentforce agent's natural-language acknowledgement.

If Agentforce returns a 404, your Connected App's API version or the public Agentforce endpoint path may differ from `v62.0`; see the file header in [agents/agentforce_client.py](agents/agentforce_client.py) and adjust `AGENTFORCE_API_VERSION`.
