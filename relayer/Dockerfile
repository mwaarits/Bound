# Build stage
FROM node:22-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build && npm prune --omit=dev

# Production stage
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN mkdir -p /data

EXPOSE 4000
CMD ["node", "dist/server.js"]
