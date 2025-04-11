#!/usr/bin/env bash

pnpm build
exec podman build -t framecraft/api .