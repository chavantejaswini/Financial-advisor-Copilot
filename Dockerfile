# Advisor Meeting Prep Copilot - production image
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application and data
COPY app/ ./app/
COPY agents/ ./agents/
COPY data/ ./data/

# Railway sets PORT; default 8501 for local Docker
EXPOSE 8501
ENV STREAMLIT_SERVER_HEADLESS=true
ENV PORT=8501

# Run from project root; use PORT so Railway can inject it
CMD ["sh", "-c", "streamlit run app/streamlit_app.py --server.port=${PORT:-8501} --server.address=0.0.0.0"]
