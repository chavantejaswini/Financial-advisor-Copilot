# Deploy to Hugging Face Spaces (free, no credit card)

This app ships as a single Docker container (FastAPI serves the built React UI
**and** the API). Hugging Face Spaces runs Docker containers on free CPU
hardware, so it's a good home for the live demo.

The repo is already configured:
- `README.md` has the Space config block (`sdk: docker`, `app_port: 7860`).
- `Dockerfile` listens on port **7860** (the port HF expects).

## 1. Create the Space

1. Sign in (free) at <https://huggingface.co>.
2. **New → Space**.
3. Owner: your account · **Space name**: `advisor-copilot`.
4. **Space SDK**: **Docker** → template **Blank**.
5. Hardware: **CPU basic** (free). Visibility: see the security note below.
6. **Create Space** (it starts empty).

## 2. Add your secrets

In the Space → **Settings → Variables and secrets → New secret**:

| Name | Required? | Notes |
|------|-----------|-------|
| `OPENAI_API_KEY` | **Yes** | Without it the pipeline can't run. |
| `CRM_BACKEND` | Recommended for a public demo | Set to `csv` to run fully offline (no writes to your Salesforce org). |
| `SF_USERNAME`, `SF_PASSWORD`, `SF_SECURITY_TOKEN` | Only for live Salesforce | Omit (or use `CRM_BACKEND=csv`) for a safe public demo. |
| `SF_DOMAIN`, `SF_MYDOMAIN` | Optional | See [SALESFORCE_SETUP.md](SALESFORCE_SETUP.md). |
| `AGENTFORCE_*` | Optional | Enables the hybrid Agentforce path. |

Add these as **secrets** (not public variables).

## 3. Push the code to the Space

The Space is its own git repo. From this project folder:

```bash
# One-time: add the Space as a remote (use your HF username)
git remote add space https://huggingface.co/spaces/<your-hf-username>/advisor-copilot

# Push main — this triggers the Docker build
git push space main
```

When prompted for a password, paste a **Hugging Face access token** with
*write* scope (create one at <https://huggingface.co/settings/tokens>). Your HF
username is the "username".

The first build takes ~5–10 min (it builds the React app, then installs the
Python deps). Watch progress on the Space's **Logs** tab.

## 4. Open the live app

`https://<your-hf-username>-advisor-copilot.hf.space`

The top-bar badge shows which mode it came up in — **Live Salesforce**,
**Hybrid · Agentforce**, or **CSV fallback** — so you can confirm the secrets
took effect.

## Updating later

Every push to the Space rebuilds it:

```bash
git push space main
```

(If you merge new work into `main` on GitHub first, pull it locally, then push
to `space`.)

## ⚠️ Security note for a public Space

A **public** Space means anyone can open the URL and run the pipeline, which
spends **your** OpenAI credits and — if Salesforce is configured — can create
real Tasks in your org. For a portfolio demo:

- Set **`CRM_BACKEND=csv`** so the demo can never write to your live org, **or**
- Make the Space **private** (Settings → change visibility), **or**
- Put a usage cap on your OpenAI key.

The mock CSV fixtures in `data/` give a fully functional demo on their own, so
`CRM_BACKEND=csv` is the simplest safe choice for a public link.
