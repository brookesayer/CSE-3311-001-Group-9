FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system deps (if any image libs are needed later, add here)
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt \
    && pip install --no-cache-dir "sqlalchemy>=2.0"

# App source
COPY backend/ /app/

# Expose API port
EXPOSE 8000

# Default to file-backed API (no DB) unless overridden at runtime
ENV USE_DB=0

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
