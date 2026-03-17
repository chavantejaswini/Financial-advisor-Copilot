"""
FastAPI backend for Advisor Meeting Prep Copilot.
Serves /api/clients, /api/prep and (in production) static frontend.
"""

import logging
import math
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

# Load .env so OPENAI_API_KEY is available when running locally
from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Import after path is set
from agents.access_agent import load_all_data
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
    """Ensure every unhandled error returns JSON (not HTML)."""
    from fastapi.responses import JSONResponse
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    return JSONResponse(status_code=500, content={"detail": str(exc)})


class PrepRequest(BaseModel):
    client_id: str
    model: str = "gpt-4o-mini"
    notes: str | None = None


@app.get("/api/clients")
def list_clients():
    """Return list of clients for the dropdown."""
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
    """Replace NaN/inf with None so the response is JSON-serializable (pandas can produce NaN)."""
    if isinstance(obj, dict):
        return {k: _sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize_for_json(v) for v in obj]
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    return obj


def _check_api_key():
    """Validate OpenAI API key before running the pipeline; raise HTTPException if missing."""
    from agents.llm_client import get_client
    try:
        get_client()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/prep")
def generate_prep(req: PrepRequest):
    """Run the copilot pipeline and return meeting prep + relationships + raw context."""
    _check_api_key()
    data_dir = ROOT / "data"
    try:
        result = run_copilot(req.client_id, data_dir=data_dir, model=req.model)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Prep pipeline failed")
        raise HTTPException(status_code=500, detail=str(e))
    return _sanitize_for_json(result)


# Mount static frontend last so /api routes take precedence (built files in frontend/dist)
static_dir = ROOT / "frontend" / "dist"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
else:
    @app.get("/")
    def root():
        return {"message": "Advisor Meeting Prep Copilot API", "docs": "/docs", "clients": "/api/clients", "prep": "POST /api/prep"}
