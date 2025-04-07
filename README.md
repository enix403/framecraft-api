# ⚙️ FrameCraft REST API

This is the backend API for FrameCraft, written in Node.js and TypeScript.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone --recurse-submodules https://github.com/enix403/framecraft-api
cd framecraft-api
```

> Or if you've already cloned it:

```bash
git submodule update --init --recursive
```

### 1. Start the Blueprint microservice

From inside the project:

```bash
cd blueprint
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
gunicorn -w 4 -b 0.0.0.0:3002 httpservice.httpservice:app
# or run it in dev mode using
python httpservice/httpservice.py
```

### 2. Install dependencies

Back in the project root, install the API server dependencies using:

```bash
pnpm install
```

### 3. Configure environment

Make sure the following env variables are set in the `.env` file in the project root:

```bash
PORT=3001
BLUEPRINT_URL=http://localhost:3002
MONGO_URL=...
JWT_SIGNING_KEY=...
CLIENT_URL=...
MAIL_HOST=...
MAIL_PORT=...
MAIL_USER=...
MAIL_PASS=...
```

### 4. Start the API server

Start the API server using in dev mode

```bash
pnpm run dev
```

The server will be available at [http://localhost:3001](http://localhost:3001)

### 5. Building the API server

You can build the API server for production using

```bash
pnpm run build
```

It will compile the project and generate a `build` folder. This compiled server can be started using

```bash
pnpm run start
```

## 🐳 Optional: Running with Docker

This will run **both** the REST API and the Blueprint service inside a single container.

### 1. Build the image

```bash
podman build -t @framecraft/api .
```

### 2. Run the container

```bash
podman run -d -p 3001:3000 \
  -e MONGO_URL=... \
  -e JWT_SIGNING_KEY=... \
  -e CLIENT_URL=... \
  -e MAIL_HOST=... \
  -e MAIL_PORT=... \
  -e MAIL_USER=... \
  -e MAIL_PASS=... \
  @framecraft/api
```

The API will be accessible at [http://localhost:3001](http://localhost:3001)

> The `BLUEPRINT_URL` is automatically set internally when using Docker.

## 📁 Submodule: Blueprint

This repo includes the AI model microservice as a Git submodule in the `blueprint/` directory.
See [`blueprint/README.md`](./blueprint/README.md) for standalone usage and development details.
