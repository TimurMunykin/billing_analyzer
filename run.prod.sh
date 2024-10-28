#!/bin/bash

echo "Starting production environment with Docker Compose..."

# Check if docker-compose or docker compose is available
if command -v docker-compose &> /dev/null
then
    docker-compose up --build -d
elif docker compose version &> /dev/null
then
    docker compose up --build -d
else
    echo "Neither docker-compose nor docker compose is available. Please install Docker Compose."
    exit 1
fi
