# --- Stage 1: Build ---
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/ ./packages/
COPY apps/ ./apps/

# Install all deps (needed to build workspace packages)
RUN pnpm install --frozen-lockfile

# Build all workspace packages in dependency order
RUN pnpm build

# --- Stage 2: Runtime ---
FROM node:22-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

ENV NODE_ENV=production

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/ ./packages/
COPY apps/ ./apps/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy built dist files from builder
COPY --from=builder /app/packages/analytics-engine/dist ./packages/analytics-engine/dist
COPY --from=builder /app/packages/api-contracts/dist ./packages/api-contracts/dist
COPY --from=builder /app/packages/confidence-model/dist ./packages/confidence-model/dist
COPY --from=builder /app/packages/contribution-collector/dist ./packages/contribution-collector/dist
COPY --from=builder /app/packages/contribution-rules/dist ./packages/contribution-rules/dist
COPY --from=builder /app/packages/domain/dist ./packages/domain/dist
COPY --from=builder /app/packages/github-client/dist ./packages/github-client/dist
COPY --from=builder /app/packages/language-analytics/dist ./packages/language-analytics/dist
COPY --from=builder /app/packages/normalizer/dist ./packages/normalizer/dist
COPY --from=builder /app/packages/observability/dist ./packages/observability/dist
COPY --from=builder /app/packages/svg-renderer/dist ./packages/svg-renderer/dist
COPY --from=builder /app/packages/themes/dist ./packages/themes/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3000

CMD ["node", "apps/api/dist/index.js"]
