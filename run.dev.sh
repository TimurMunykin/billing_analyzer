#!/bin/bash
echo "Starting local development environment..."

docker compose up -d db

# BE
cd app
npm install
npm run build
npm run dev &

# FE
cd ../frontend
npm install
npm start &

echo "Local environment is running:"
echo " - Backend at http://localhost:3000"
echo " - Frontend at http://localhost:3001"
