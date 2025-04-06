#!/bin/bash

# Activate Python virtual environment
source /venv/bin/activate

# Start the Python microservice in the background
gunicorn -w 4 -b 0.0.0.0:3002 blueprint.httpservice.httpservice:app &

# Wait a bit to ensure the Python service is up (optional safety)
sleep 2

# Start Node.js API
NODE_ENV=production NODE_OPTIONS=--disable-warning=DEP0174 TS_NODE_BASEURL=./build \
node -r tsconfig-paths/register build/main.js