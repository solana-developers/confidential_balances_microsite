# Base Node.js image
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY ../package.json ../pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies from the previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY .. .

# Build the application
RUN pnpm build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy necessary directories and files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"] 