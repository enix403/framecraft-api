#!/usr/bin/env bash

ENV_FILE=".env"

# Create a temporary file
envfile=$(mktemp)

# Ensure the temp file is deleted on exit, regardless of success or error
cleanup() {
  rm -f "$envfile"
}
trap cleanup EXIT

# Populate the temp env file using Node.js
node -e "
  Object.entries(require('dotenv').parse(require('fs').readFileSync('$ENV_FILE')))
    .forEach(([k, v]) => console.log(\`\${k}=\${v}\`));
" > "$envfile"

# Run the podman container and capture its exit code
podman run --env-file "$envfile" -p 3001:80 --rm -it framecraft/api
exit_code=$?

# Exit with the same status as the podman run command
exit $exit_code
