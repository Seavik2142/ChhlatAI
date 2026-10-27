# ====================================================
# Stage 1: Development Environment & Dependencies
# ====================================================
FROM node:22-alpine AS dev

WORKDIR /app

# Cache package dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# ====================================================
# Stage 2: Build Frontend Assets
# ====================================================
FROM dev AS builder
RUN npm run build

# ====================================================
# Stage 2: Production Web Server (Nginx)
# ====================================================
FROM nginx:alpine AS runner

# Remove default nginx static web files
RUN rm -rf /usr/share/nginx/html/*

# Copy built production assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
    CMD wget -qO- http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
