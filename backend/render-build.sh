#!/usr/bin/env bash
# exit on error
set -o errexit

echo "📦 Installing backend dependencies..."
pip install -r requirements.txt

# Create/Update database schema for PostgreSQL
echo "🗄️ Running database migrations..."
flask db upgrade

# Always ensure menu data exists in new environments
echo "🌱 Initializing database with seed data..."
python seed.py

echo "✅ Build script completed successfully."
