# Multi-stage Python image: install dependencies as root, run uvicorn as non-root user `app`.
FROM python:3.11-slim AS builder
RUN pip install --no-cache-dir uv
WORKDIR /build
COPY pyproject.toml ./
COPY app ./app
RUN uv pip install --system --no-cache .

FROM python:3.11-slim AS runtime
RUN groupadd --gid 1000 app && useradd --uid 1000 --gid app --create-home app
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --chown=app:app app ./app
USER app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
