FROM oven/bun:1 AS base
WORKDIR /app

# Copy workspace root package.json + lockfile for workspace resolution
COPY package.json yarn.lock* bun.lock* ./

# Copy shared package
COPY shared/ ./shared/

# Copy server package
COPY server/package.json ./server/
WORKDIR /app/server
RUN bun install --production

# Copy server source
COPY server/ ./

# Ensure data dir exists (volume mount point)
RUN mkdir -p /data

EXPOSE 8080
ENV PORT=8080

CMD ["bun", "run", "src/index.ts"]
