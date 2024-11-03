#!/bin/bash
echo "Starting local development environment..."

docker compose up -d db

# BE
./start-backend.sh &

# FE
./start-frontend.sh &

echo "Local environment is running:"
echo " - Backend at http://localhost:3000"
echo " - Frontend at http://localhost:3001"
