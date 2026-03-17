#!/bin/sh
set -e

echo "🔄 Waiting for database to be ready (handled by docker-compose depends_on healthcheck)..."

echo "🔄 Syncing database schema..."
# Use db push to sync schema (no migration files needed)
./node_modules/.bin/prisma db push

echo "✅ Migrations completed!"

echo "🚀 Starting Next.js server..."
exec "$@"
