# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG PYTHON_VERSION=3.12
FROM python:${PYTHON_VERSION} AS base

# Prevents Python from writing pyc files.
ENV PYTHONDONTWRITEBYTECODE=1

# Keeps Python from buffering stdout and stderr to avoid situations where
# the application crashes without emitting any logs due to buffering.
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY . .
# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.cache/pip to speed up subsequent builds.
# Leverage a bind mount to requirements.txt to avoid having to copy them into
# into this layer.
RUN pip install --upgrade pip uv \
    && uv sync

# RUN --mount=type=cache,target=/root/.cache/pip \
#     --mount=type=bind,source=requirements.txt,target=requirements.txt \
#     python -m pip install -r requirements.txt

FROM python:${PYTHON_VERSION}-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update \
 && apt-get install -y --no-install-recommends nginx cron \
 && apt-get clean && rm -rf /var/lib/apt/lists/* \
 && pip install --no-cache-dir supervisor \
 && touch /var/log/crawler.log

WORKDIR /app

COPY --from=base /app/.venv/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=base /app/docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=base /app/docker/supervisord.conf /etc/supervisor/supervisord.conf
COPY --from=base /app/mcp mcp
COPY --from=base /app/crawler crawler

COPY --from=base /app/docker/crawler /etc/cron.d/
RUN chmod 0644 /etc/cron.d/crawler && crontab /etc/cron.d/crawler

CMD ["supervisord", "-n"]
