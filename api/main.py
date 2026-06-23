"""
FastAPI backend for Advisor Meeting Prep Copilot.

Endpoints:
  GET  /api/health    Connectivity status for OpenAI / Salesforce / Agentforce.
  GET  /api/clients   Client dropdown (Salesforce Accounts when configured, else CSV).
  POST /api/prep      Run the 3-agent pipeline; returns prep + CRM actions taken
                      + (when configured) the parallel Agentforce response.
"""

from __future__ import annotations

import logging
import math
import sys
from pathlib import Path
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from agents.access_agent import list_clients_sf, load_all_data
from agents.agentforce_client import is_configured as agentforce_configured
from agents.salesforce_client import is_configured as sf_configured
from agents.salesforce_client import probe as sf_probe
from app.pipeline import run_copilot


app = FastAPI(title="Advisor Meeting Prep Copilot API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
def catch_all(_request, exc: Exception):
    from fastapi.responses import JSONResponse
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    return JSONResponse(status_code=500, content={"detail": str(exc)})


class PrepRequest(BaseModel):
    client_id: str
    model: str = "gpt-4o-mini"
    notes: Optional[str] = None


@app.get("/api/health")
def health():
    """Surface which CRM backend is live so the UI can render an honest status badge."""
    return {
        "openai_configured": _openai_ok(),
        "salesforce_configured": sf_configured(),
        "salesforce_instance": sf_probe() if sf_configured() else None,
        "agentforce_configured": agentforce_configured(),
    }


def _openai_ok() -> bool:
    from agents.llm_client import get_client
    try:
        get_client()
        return True
    except Exception:
        return False


@app.get("/api/clients")
def list_clients():
    """Salesforce-backed when configured; CSV fallback otherwise."""
    if sf_configured():
        try:
            return list_clients_sf()
        except Exception as e:
            logger.warning("Salesforce client list failed, falling back to CSV: %s", e)
    data_dir = ROOT / "data"
    all_data = load_all_data(data_dir)
    clients_df = all_data.get("clients")
    if clients_df is None or clients_df.empty:
        return []
    return [
        {"client_id": row["client_id"], "client_name": row["client_name"]}
        for _, row in clients_df.iterrows()
    ]


def _sanitize_for_json(obj):
    """Replace NaN/inf with None so pandas-sourced floats don't break JSON encoding."""
    if isinstance(obj, dict):
        return {k: _sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize_for_json(v) for v in obj]
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    return obj


def _check_api_key():
    from agents.llm_client import get_client
    try:
        get_client()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/prep")
def generate_prep(req: PrepRequest):
    _check_api_key()
    data_dir = ROOT / "data"
    try:
        result = run_copilot(req.client_id, data_dir=data_dir, model=req.model, advisor_note=req.notes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Prep pipeline failed")
        raise HTTPException(status_code=500, detail=str(e))
    return _sanitize_for_json(result)


static_dir = ROOT / "frontend" / "dist"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
else:
    @app.get("/")
    def root():
        return {
            "message": "Advisor Meeting Prep Copilot API",
            "docs": "/docs",
            "health": "/api/health",
            "clients": "/api/clients",
            "prep": "POST /api/prep",
        }
