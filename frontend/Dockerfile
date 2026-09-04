# frontend/Dockerfile — çok aşamalı; Next.js prod (next start). Root olmayan runtime.
# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
# Next.js rewrites() build anında baked olur → /api proxy hedefini build'de sabitle.
ARG BACKEND_URL=http://backend:3000
ENV BACKEND_URL=$BACKEND_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.js ./next.config.js
USER app
EXPOSE 3001
# BACKEND_URL ile /api proxy hedefi belirlenir (compose'da http://backend:3000).
CMD ["npm", "run", "start"]
