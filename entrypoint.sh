#!/bin/bash

cd /app/blueprint

# # Start the Python microservice in the background
gunicorn -w 4 --timeout 0 -b 0.0.0.0:3002 httpservice.httpservice:app &

# Wait for a valid HTTP response from blueprint /healthcheck
echo "Waiting for blueprint on port 3002..."
until curl -s http://localhost:3002/healthcheck > /dev/null; do
    sleep 5
done
echo "blueprint is up!"

cd /app

. $NVM_DIR/nvm.sh

# Start Node.js API
exec env \
  APP_NAME="FrameCraft" \
  APP_VERSION="1.0.0" \
  BLUEPRINT_URL="http://localhost:3002" \
  PORT=80 \
  pnpm start
