FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace root
COPY package.json package-lock.json* ./
COPY packages/sdk/package.json packages/sdk/
COPY packages/bot/package.json packages/bot/

# Install all dependencies
RUN npm install --workspace=packages/sdk --workspace=packages/bot 2>/dev/null || npm install

# Copy source
COPY packages/sdk/ packages/sdk/
COPY packages/bot/ packages/bot/
COPY tsconfig.json ./

# Build SDK first, then bot
RUN cd packages/sdk && npx tsup src/index.ts --format esm --clean 2>/dev/null || true
RUN cd packages/bot && npx tsup src/index.ts --format esm --clean

# --- Production stage ---
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/sdk/package.json packages/sdk/
COPY --from=builder /app/packages/sdk/dist/ packages/sdk/dist/
COPY --from=builder /app/packages/bot/package.json packages/bot/
COPY --from=builder /app/packages/bot/dist/ packages/bot/dist/
COPY --from=builder /app/node_modules/ ./node_modules/

ENV NODE_ENV=production

CMD ["node", "packages/bot/dist/index.js"]
