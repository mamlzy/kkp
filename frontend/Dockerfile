# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage with Caddy
FROM caddy:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /srv

# Create Caddyfile for serving on port 5173
RUN printf ':5173 {\n\
    root * /srv\n\
    file_server\n\
    try_files {path} /index.html\n\
}\n' > /etc/caddy/Caddyfile

# Health check for Coolify
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5173/ || exit 1

EXPOSE 5173
