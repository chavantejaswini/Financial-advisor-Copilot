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


def inject_css():
    """Load and inject production CSS."""
    css_path = Path(__file__).resolve().parent / "styles.css"
    if css_path.exists():
        with open(css_path) as f:
            st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)


def render_list_section(items, empty_msg="None identified."):
    """Render a list of items or an empty state."""
    if not items:
        st.markdown(f'<p class="list-empty">{empty_msg}</p>', unsafe_allow_html=True)
        return
    for item in items:
        st.markdown(f"- {item}")


def is_production():
    """Heuristic: running in a deployed environment (e.g. Railway)."""
    return os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RENDER") or os.getenv("FLY_APP_NAME")


def api_key_error_message():
    """User-facing message for missing/invalid API key (production vs local)."""
    if is_production():
        return (
            "**OPENAI_API_KEY** is not set or is invalid. "
            "Add it in your deployment platform's **Variables** (or **Secrets**), then redeploy."
        )
    return (
        "**OPENAI_API_KEY** is missing or still the placeholder. "
        "Set it in `.env` in the project root: `OPENAI_API_KEY=sk-...` (no quotes, no spaces)."
    )


# --- Page config and CSS ---
st.set_page_config(
    page_title="Advisor Meeting Prep Copilot",
    page_icon="📋",
    layout="wide",
    initial_sidebar_state="expanded",
)
inject_css()

# --- Header ---
st.markdown(
    '<div class="app-header">'
    '<h1>📋 Advisor Meeting Prep Copilot</h1>'
    '<p class="app-tagline">Synthesize client context, relationships, and recommended talking points before your meeting.</p>'
    '</div>',
    unsafe_allow_html=True,
)

# --- Sidebar ---
with st.sidebar:
    st.markdown("### Meeting setup")
    data_dir = ROOT / "data"
    all_data = load_all_data(data_dir)
    clients_df = all_data.get("clients")

    st.markdown("**Client**")
    if clients_df is not None and not clients_df.empty:
        options = list(clients_df["client_id"])
        labels = [f"{row['client_name']} ({row['client_id']})" for _, row in clients_df.iterrows()]
        choice = st.selectbox("Select client", range(len(options)), format_func=lambda i: labels[i], label_visibility="collapsed")
        client_id = options[choice]
    else:
        client_id = st.text_input("Client ID", value="C001", help="e.g. C001, C002, C003", label_visibility="collapsed")

    st.markdown("**Additional notes**")
    extra_notes = st.text_area(
        "Additional notes (optional)",
        height=100,
        placeholder="Paste any extra context for this meeting...",
        label_visibility="collapsed",
    )

    st.markdown("**Model**")
    model = st.selectbox(
        "Model",
        ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
        index=0,
        label_visibility="collapsed",
    )

    st.divider()
    run_btn = st.button("Generate meeting prep", type="primary", use_container_width=True)

# --- Main content ---
if run_btn:
    try:
        from agents.llm_client import get_client
        get_client()
    except ValueError as e:
        st.error(api_key_error_message())
        st.stop()

    with st.spinner("Loading client data..."):
        pass
    with st.spinner("Analyzing relationships..."):
        pass
    with st.spinner("Generating meeting prep..."):
        try:
            result = run_copilot(client_id, data_dir=data_dir, model=model)
        except Exception as e:
            err = str(e).lower()
            if "invalid" in err and "api" in err or "incorrect" in err or "authentication" in err or "401" in err:
                st.error(api_key_error_message())
            else:
                st.error("Something went wrong. Please try again or check the error below.\n\n" + str(e))
            st.stop()

    summary = result["summary_output"]
    conn = result["connection_output"]

    if summary.get("error"):
        st.error("Summary error: " + summary["error"])
        if summary.get("raw_response"):
            with st.expander("Raw response"):
                st.code(summary["raw_response"])
        st.stop()

    client_name = summary.get("client_name", client_id)
    st.success(f"Meeting prep ready for **{client_name}**")

    tab1, tab2, tab3 = st.tabs(["Meeting prep", "Relationships", "Raw context"])

    with tab1:
        st.subheader("Client summary")
        st.write(summary.get("client_summary") or "—")

        st.divider()
        col1, col2 = st.columns(2)
        with col1:
            st.markdown("**Key signals**")
            render_list_section(
                summary.get("key_financial_or_relationship_signals"),
                empty_msg="No key signals identified.",
            )
            st.markdown("**Risks & opportunities**")
            render_list_section(
                summary.get("potential_risks_or_opportunities"),
                empty_msg="None identified.",
            )
        with col2:
            st.markdown("**Suggested discussion topics**")
            render_list_section(
                summary.get("suggested_discussion_topics"),
                empty_msg="None suggested.",
            )
            st.markdown("**Next-best actions**")
            render_list_section(
                summary.get("recommended_next_best_actions"),
                empty_msg="None recommended.",
            )

        review_items = summary.get("confidence_notes_or_human_review") or []
        if review_items:
            st.divider()
            st.markdown("**Confidence / human review**")
            for c in review_items:
                st.info(c)

    with tab2:
        st.subheader("Relationships")
        render_list_section(
            conn.get("relationships"),
            empty_msg="No relationships identified.",
        )

    with tab3:
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
    st.markdown(
        '<div class="empty-state">'
        '<div class="empty-state-icon">📋</div>'
        '<p class="empty-state-title">Ready when you are</p>'
        '<p class="empty-state-desc">Select a client in the sidebar and click <strong>Generate meeting prep</strong> to run the copilot and get a brief before your meeting.</p>'
        '</div>',
        unsafe_allow_html=True,
    )
    with st.expander("Data sources (mock CSVs)"):
        st.markdown("""
        - **clients.csv** — Profile, risk tolerance, AUM band, advisor notes  
        - **crm_notes.csv** — Meeting/call/email history  
        - **portfolio_activity.csv** — Holdings, allocation, alerts  
        - **market_updates.csv** — Market and regulatory updates  
        - **client_goals.csv** — Goals, time horizons, status  
        - **compliance_considerations.csv** — Suitability, disclosure, documentation  
        """)

# --- Footer ---
st.markdown(
    '<div class="app-footer">Advisor Meeting Prep Copilot · Data from mock CSVs · Set OPENAI_API_KEY in your environment for AI summaries.</div>',
    unsafe_allow_html=True,
)
