# Stage 1: build frontend (React + TypeScript + Vite)
FROM node:20-alpine AS frontend
WORKDIR /build
COPY frontend/ ./
RUN npm install && npm run build

# Stage 2: Python API + static frontend
FROM python:3.12-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend and data
COPY api/ ./api/
COPY app/ ./app/
COPY agents/ ./agents/
COPY data/ ./data/

# Copy built frontend from stage 1
COPY --from=frontend /build/dist ./frontend/dist

# Hugging Face Spaces expects the app on port 7860 (see app_port in README).
# Platforms like Railway/Render inject their own PORT, which overrides this default.
EXPOSE 7860
ENV PORT=7860

# Run FastAPI (serves API + static frontend)
CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
