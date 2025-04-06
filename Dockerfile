# -------------------------------------
# Stage 1: Python Microservice Builder
# -------------------------------------
FROM python:3.9.21-slim AS python-builder

WORKDIR /app/blueprint

# Install system dependencies for pygraphviz
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libgraphviz-dev \
    graphviz \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements to leverage layer cache
COPY blueprint/requirements.txt ./

# Create venv and install dependencies
RUN python3 -m venv /venv && \
    /venv/bin/pip install --upgrade pip && \
    /venv/bin/pip install -r requirements.txt

# Copy the rest of the blueprint source
COPY blueprint /app/blueprint

# -----------------------------------
# Stage 2: Node.js API Builder
# -----------------------------------
FROM node:23.11.0-alpine3.20 AS node-builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies with cache
RUN pnpm config set store-dir /root/.pnpm-store && \
    pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# -----------------------------------
# Stage 3: Final Runtime Container
# -----------------------------------
FROM python:3.9.21-slim AS final

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl gnupg git ca-certificates \
    libgraphviz-dev \
    graphviz \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    corepack enable && corepack prepare pnpm@latest --activate && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy Python venv and blueprint service
COPY --from=python-builder /venv /venv
COPY --from=python-builder /app/blueprint ./blueprint

# Copy Node.js build output and dependencies
COPY --from=node-builder /app/build ./build
COPY --from=node-builder /app/node_modules ./node_modules
COPY --from=node-builder /app/package.json ./

# Copy the entrypoint script
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Build-time env variables
ARG APP_NAME
ARG APP_VERSION

ENV APP_NAME=${APP_NAME}
ENV APP_VERSION=${APP_VERSION}
ENV MODEL_SERVICE_URL=http://localhost:3002
ENV PORT=3000

EXPOSE 3000

# Start both services
ENTRYPOINT ["./entrypoint.sh"]
