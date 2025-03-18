#!/usr/bin/env bash

CONTAINER_NAME="allapi-mongodb"
DATABASE_NAME="allapi"

podman container stop $CONTAINER_NAME
podman container rm $CONTAINER_NAME

podman run -d \
  --rm -it \
  --name $CONTAINER_NAME \
  -v ./mongo-data:/data/db \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=user \
  -e MONGO_INITDB_ROOT_PASSWORD=pass \
  -e MONGO_INITDB_DATABASE=$DATABASE_NAME \
  mongo:6.0
