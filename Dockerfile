# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Build Angular 21 (mspos-v3)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine3.21 AS builder

WORKDIR /app

# Patch OS-level packages first (resolves Alpine/musl CVEs)
RUN apk upgrade --no-cache

# Copy dependency manifests first (layer caching)
COPY package.json package-lock.json ./

# Install dependencies (clean install, no dev-server overhead)
RUN npm ci --prefer-offline --no-audit --no-fund

# Copy the rest of the source
COPY . .

# Production build → output: dist/mspos-v3/browser/
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Serve with Nginx unprivileged (runs as uid 101, not root)
# Smaller attack surface: no setuid binaries, no root capabilities
# ─────────────────────────────────────────────────────────────────────────────
FROM nginxinc/nginx-unprivileged:1.27-alpine3.21 AS runtime

# Patch remaining Alpine packages in the runtime layer
USER root
RUN apk upgrade --no-cache
USER 101

# Inject our Nginx config (SPA fallback + gzip + security headers)
COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf

# Copy Angular build output (Angular 17+ places files in /browser sub-dir)
COPY --from=builder --chown=101:101 /app/dist/mspos-v3/browser /usr/share/nginx/html

# nginx-unprivileged listens on 8080 (binding <1024 requires root)
EXPOSE 8080

# Nginx runs in the foreground
CMD ["nginx", "-g", "daemon off;"]
