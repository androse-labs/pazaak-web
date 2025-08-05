# ---- Build Stage ----
FROM oven/bun:latest AS builder
WORKDIR /app

# Copy everything needed for build
COPY . .

WORKDIR /app/apps/server
RUN bun install
RUN bun run build

# ---- Production Stage ----
FROM oven/bun:alpine 
WORKDIR /app

# ONLY copy built output from builder stage
COPY --from=builder /app/apps/server/dist/index.js ./index.js

EXPOSE 443
CMD ["bun", "./index.js"]
