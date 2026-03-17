"""
Advisor Meeting Prep Copilot - Streamlit UI.
Run: streamlit run app/streamlit_app.py
"""

import os
import streamlit as st
from pathlib import Path

# Load env for OpenAI
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# Add project root for imports
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in __import__("sys").path:
    __import__("sys").path.insert(0, str(ROOT))

from agents.access_agent import load_all_data, get_client_context, DATA_DIR
from app.pipeline import run_copilot


st.set_page_config(page_title="Advisor Meeting Prep Copilot", page_icon="📋", layout="wide")

st.title("📋 Advisor Meeting Prep Copilot")
st.caption("Synthesize client context, relationships, and recommended talking points before your meeting.")

# Sidebar: client selection and optional notes
with st.sidebar:
    st.header("Meeting setup")
    data_dir = ROOT / "data"
    all_data = load_all_data(data_dir)
    clients_df = all_data.get("clients")
    if clients_df is not None and not clients_df.empty:
        options = list(clients_df["client_id"])  # or show name + id
        labels = [f"{row['client_name']} ({row['client_id']})" for _, row in clients_df.iterrows()]
        choice = st.selectbox("Select client", range(len(options)), format_func=lambda i: labels[i])
        client_id = options[choice]
    else:
        client_id = st.text_input("Client ID", value="C001", help="e.g. C001, C002, C003")
    extra_notes = st.text_area("Additional notes (optional)", height=100, placeholder="Paste any extra context for this meeting...")
    model = st.selectbox("Model", ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"], index=0)
    run_btn = st.button("Generate meeting prep", type="primary")

# Main area
if run_btn:
    try:
        from agents.llm_client import get_client
        get_client()  # validate key before running pipeline
    except ValueError as e:
        st.error(str(e))
        st.info("Edit `.env` in the project root: put your key on the line `OPENAI_API_KEY=sk-...` (no quotes, no spaces).")
        st.stop()
    with st.spinner("Access Agent → loading data..."):
        pass
    with st.spinner("Connection Agent → finding relationships..."):
        pass
    with st.spinner("Summary Agent → generating prep..."):
        try:
            result = run_copilot(client_id, data_dir=data_dir, model=model)
        except Exception as e:
            err = str(e).lower()
            if "invalid" in err and "api" in err or "incorrect" in err or "authentication" in err or "401" in err:
                st.error("Invalid API key. Check your `.env`: use your real OpenAI key, no quotes, no extra spaces. Get a key at https://platform.openai.com/api-keys")
            else:
                st.error("Error: " + str(e))
            st.stop()

    summary = result["summary_output"]
    conn = result["connection_output"]

    if summary.get("error"):
        err = summary["error"]
        if "invalid" in err.lower() and "api" in err.lower():
            st.error("Invalid API key. In `.env` set OPENAI_API_KEY=sk-... (your real key, no quotes). Get one at https://platform.openai.com/api-keys")
        else:
            st.error("Summary error: " + err)
        if summary.get("raw_response"):
            with st.expander("Raw response"):
                st.code(summary["raw_response"])
    else:
        st.success(f"Meeting prep ready for **{summary.get('client_name', client_id)}**")

        tabs = st.tabs(["Meeting prep", "Relationships", "Raw context"])
        with tabs[0]:
            st.subheader("Client summary")
            st.write(summary.get("client_summary", "—"))

            col1, col2 = st.columns(2)
            with col1:
                st.subheader("Key signals")
                for s in summary.get("key_financial_or_relationship_signals") or []:
                    st.markdown(f"- {s}")
                st.subheader("Risks & opportunities")
                for r in summary.get("potential_risks_or_opportunities") or []:
                    st.markdown(f"- {r}")
            with col2:
                st.subheader("Suggested discussion topics")
                for t in summary.get("suggested_discussion_topics") or []:
                    st.markdown(f"- {t}")
                st.subheader("Next-best actions")
                for a in summary.get("recommended_next_best_actions") or []:
                    st.markdown(f"- {a}")

            st.subheader("⚠️ Confidence / human review")
            for c in summary.get("confidence_notes_or_human_review") or []:
                st.info(c)

        with tabs[1]:
            st.subheader("Connection agent: relationships")
            for rel in conn.get("relationships") or []:
                st.markdown(f"- {rel}")

        with tabs[2]:
            ctx = result["client_context"]
            st.json({
                "client_profile": ctx.get("client_profile"),
                "crm_notes": ctx.get("crm_notes"),
                "portfolio_activity": ctx.get("portfolio_activity"),
                "client_goals": ctx.get("client_goals"),
                "compliance_considerations": ctx.get("compliance_considerations"),
                "market_updates_sample": (ctx.get("market_updates") or [])[:3],
            })

else:
    st.info("Select a client and click **Generate meeting prep** to run the copilot.")
    with st.expander("Available data sources (mock CSVs)"):
        st.write("- **clients.csv**: Profile, risk tolerance, AUM band, advisor notes")
        st.write("- **crm_notes.csv**: Meeting/call/email history")
        st.write("- **portfolio_activity.csv**: Holdings, allocation, alerts")
        st.write("- **market_updates.csv**: Market and regulatory updates")
        st.write("- **client_goals.csv**: Goals, time horizons, status")
        st.write("- **compliance_considerations.csv**: Suitability, disclosure, documentation")
