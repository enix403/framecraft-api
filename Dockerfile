# syntax=docker/dockerfile:1.4
FROM python:3.9.21-slim AS python-builder

ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js, Python, and dependencies for both services
RUN apt-get update && \
  apt-get install -y \
  git curl \
  gcc g++ make pkg-config \
  libgraphviz-dev \
  graphviz \
  pkg-config \
  && curl -sL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get clean

ENV NVM_DIR /root/.nvm
ENV NODE_VERSION 23.11.0

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash \
  && . $NVM_DIR/nvm.sh \
  && nvm install $NODE_VERSION \
  && nvm alias default $NODE_VERSION \
  && nvm use default

# Enable PNPM
RUN --mount=type=cache,target=/root/.cache \
  \. /root/.nvm/nvm.sh \
  && corepack enable \
  && corepack prepare pnpm@latest --activate

# ==================================
# ==== Build deps now installed ====
# ==================================

# ------------------
# ------------------

WORKDIR /app/blueprint
COPY blueprint/requirements.txt ./

RUN --mount=type=cache,target=/root/.cache/pip \
  pip install -r requirements.txt

COPY blueprint/checkpoints ./checkpoints
COPY blueprint/httpservice ./httpservice
COPY blueprint/minimal ./minimal

# ------------------
# ------------------

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,target=/root/.pnpm-store \
  . $NVM_DIR/nvm.sh \
  && pnpm config set store-dir /root/.pnpm-store \
  && pnpm install --frozen-lockfile

COPY src ./src
COPY tsconfig.json .

RUN . $NVM_DIR/nvm.sh \
  && pnpm build

# ------------------
# ------------------

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 80

CMD ["./entrypoint.sh"]
