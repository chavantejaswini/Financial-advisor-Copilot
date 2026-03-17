# Deploying Advisor Meeting Prep Copilot to the Cloud

Two main options: **Streamlit Community Cloud** (easiest, free) or **Docker** on Railway / Render / Fly.io.

---

## Option 1: Streamlit Community Cloud (recommended)

1. **Push your app to GitHub**  
   Commit and push this repo (ensure `data/` and `app/`, `agents/` are included; `.env` is in `.gitignore` and will not be pushed).

2. **Sign in at [share.streamlit.io](https://share.streamlit.io)**  
   Use your GitHub account.

3. **New app**
   - Click **“New app”**
   - **Repository**: `your-username/AIadvisor` (or your fork)
   - **Branch**: `main` (or your default)
   - **Main file path**: `app/streamlit_app.py`
   - **Advanced settings** → leave Python version default (e.g. 3.12)

4. **Secrets**
   - In the app’s **Settings** → **Secrets**, add:
   ```toml
   OPENAI_API_KEY = "sk-your-actual-openai-key"
   ```
   - Save. The app will get `OPENAI_API_KEY` as an environment variable (no `.env` file in the cloud).

5. **Deploy**  
   Click **Deploy**. The first run may take a few minutes while dependencies install.

Your app will be available at a URL like:  
`https://your-app-name-username.realm.run`

---

## Option 2: Docker (Railway, Render, Fly.io)

The repo includes a **Dockerfile**. Use it on any platform that builds and runs containers.

### Build and run locally

```bash
docker build -t advisor-copilot .
docker run -p 8501:8501 -e OPENAI_API_KEY=sk-your-key advisor-copilot
```

Open http://localhost:8501

### Railway (Docker)

1. **Push your repo to GitHub** (if not already). Ensure `Dockerfile`, `app/`, `agents/`, `data/`, and `requirements.txt` are committed.

2. **Go to [railway.app](https://railway.app)** and sign in (GitHub is supported).

3. **New project**
   - Click **“New Project”**.
   - Choose **“Deploy from GitHub repo”** and select your **AIadvisor** repo (or grant access first).
   - Railway will detect the **Dockerfile** and create a service from it.

4. **Set environment variables**
   - Open your service → **Variables** (or **Settings** → **Variables**).
   - Add:
     - `OPENAI_API_KEY` = `sk-your-actual-openai-key`
     - Optionally: `OPENAI_BASE_URL` if you use a custom endpoint.

5. **Generate a public URL**
   - Open the service → **Settings** → **Networking**.
   - Click **Generate Domain** (or **Add a domain**). Railway will give you a URL like `https://your-app.up.railway.app`.

6. **Deploy**
   - Each push to the connected branch triggers a new deploy, or use **Deploy** in the dashboard. The first build may take a few minutes.

The app listens on the port Railway provides via `PORT`; the Dockerfile is already set up to use it.

## Checklist

- [ ] Repo on GitHub (with `app/`, `agents/`, `data/`, `requirements.txt`)
- [ ] `OPENAI_API_KEY` set in the cloud (Secrets / Environment variables)
- [ ] No `.env` or secrets committed (they are in `.gitignore`)

If the app shows “OPENAI_API_KEY is missing”, add the key in the platform’s secrets or environment variables and redeploy.
