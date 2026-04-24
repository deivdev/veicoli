FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml /app/
RUN pip install --no-cache-dir \
    "fastapi>=0.115.0" \
    "uvicorn[standard]>=0.32.0" \
    "sqlalchemy>=2.0.36" \
    "alembic>=1.14.0" \
    "pydantic>=2.9.0" \
    "pydantic-settings>=2.6.0" \
    "python-jose[cryptography]>=3.3.0" \
    "bcrypt>=4.2.0" \
    "python-multipart>=0.0.12" \
    "email-validator>=2.2.0"

COPY app /app/app

RUN mkdir -p /app/data /app/uploads

ENV DATABASE_URL=sqlite:////app/data/veicoli.db \
    UPLOADS_DIR=/app/uploads

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
