#!/usr/bin/env bash

# Make sure you are logged into both Azure CLI and ACR (via podman/docker)
# az login
# az acr credential show --name framecraftregistry
# podman login framecraftregistry.azurecr.io \
#   --username FrameCraftRegistry \
#   --password xxxxxxxxxxxxxxxx
# --------------------------------------
# Or login into docker
# $ podman login docker.io
# > username: fogcode000
# > password: xxxxxxxx
# --------------------------------------

./image_build.sh # This builds an image framecraft/api

# Tag and push to ACR
# podman tag framecraft/api framecraftregistry.azurecr.io/framecraft-api:latest
# podman push framecraftregistry.azurecr.io/framecraft-api:latest

# Tag and push to Docker Hub
podman tag localhost/framecraft/api docker.io/fogcode000/framecraft-api:latest
podman push docker.io/fogcode000/framecraft-api:latest

# Restart web app to reflect changes
az webapp restart \
  --name FrameCraftApi2 \
  --resource-group FrameCraftResourceGroup