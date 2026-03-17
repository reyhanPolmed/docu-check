# ========================================
# Stage 1: Install Dependencies
# ========================================
FROM node:20-alpine AS deps

# libc6-compat is needed for certain Node.js libraries and Prisma
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package management files
COPY package.json package-lock.json* ./

# Use npm ci for clean and exact dependency installation
RUN npm ci

# ========================================
# Stage 2: Build the Application
# ========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy over dependencies from the deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy all source files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js standalone application
RUN npm run build

# Prune devDependencies after build so only production deps remain
RUN npm prune --omit=dev

# ========================================
# Stage 3: Production Runner
# ========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone output and static files
# Next.js standalone output contains everything needed to run without node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and config (needed at runtime for db push)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json

# Copy ALL production node_modules (includes prisma CLI + all transitive deps)
# This overwrites the minimal standalone node_modules with a full production set
COPY --from=builder /app/node_modules ./node_modules

# Copy and set up the entrypoint script
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Use non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
