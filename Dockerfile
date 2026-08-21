# ==========================================
# Stage 1: Build React/Vite Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# Copy dependency manifests
COPY frontend/package.json frontend/package-lock.json ./

# Clean dependency installation
RUN npm ci

# Copy entire frontend source code
COPY frontend/ ./

# Build production SPA bundle (output in /frontend/dist)
RUN npm run build

# ==========================================
# Stage 2: Backend & Production Runtime
# ==========================================
FROM python:3.11-slim AS production-runtime

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=10000

WORKDIR /app

# Install system dependencies (including build tools for native extensions)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend source code into container
COPY backend/ ./

# Copy compiled frontend from Stage 1 into backend directory
COPY --from=frontend-builder /frontend/dist /app/frontend_dist

# Create necessary upload directories with proper permissions
RUN mkdir -p /app/uploads/avatars \
             /app/uploads/documents \
             /app/uploads/schulungen \
             /app/uploads/news

# Expose Render production port (default 10000)
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-10000}/health || exit 1

# Start FastAPI application via Uvicorn (supporting Render dynamic $PORT)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
