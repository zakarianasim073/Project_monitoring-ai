#!/bin/bash
set -e

echo "🚀 Starting Project_monitoring-ai setup..."

# Backend
cd backend
echo "📂 Setting up backend..."
npm install
if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️ Fill backend/.env with MONGO_URI, GEMINI_API_KEY, JWT_SECRET"
fi
cd ..

# Frontend
cd frontend
echo "📂 Setting up frontend..."
npm install
if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️ Fill frontend/.env with API endpoints"
fi
cd ..

# Docker
echo "🐳 Building Docker containers..."
docker-compose up --build -d

echo "✅ Setup complete! Access frontend at http://localhost:3000"
