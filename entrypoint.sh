#!/bin/bash

cd /app/blueprint

# # Start the Python microservice in the background
gunicorn -w 4 -b 0.0.0.0:3002 httpservice.httpservice:app &

# Wait a bit to ensure the Python service is up (optional safety)
sleep 2

cd /app

. $NVM_DIR/nvm.sh

# Start Node.js API
exec env \
  APP_NAME="FrameCraft" \
  APP_VERSION="1.0.0" \
  MODEL_SERVICE_URL="http://localhost:3002" \
  pnpm start