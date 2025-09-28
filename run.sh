#!/bin/bash

set -e

NETWORK_NAME="frnet"\
PORT=3000

if ! docker network ls | grep -q "$NETWORK_NAME"; then
    echo "Creating Docker network $NETWORK_NAME..."
    docker network create $NETWORK_NAME
fi

cd ./backend
docker build -t backend_img .
docker run -it --name backend --network $NETWORK_NAME -p $PORT:$PORT backend_img

cd ../frontend/vitefront/frontend
npm run dev
