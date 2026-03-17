#!/bin/sh
set -e

echo "🔄 Waiting for database to be ready (handled by docker-compose depends_on healthcheck)..."

echo "🔄 Running Prisma migrations..."
# Execute migration without prompting
npx prisma migrate deploy

echo "✅ Migrations completed!"

echo "🚀 Starting Next.js server..."
exec "$@"
