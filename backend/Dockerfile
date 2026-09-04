# backend/Dockerfile — çok aşamalı (multi-stage), root olmayan runtime.
# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Prisma'nın alpine'da çalışması için openssl + libc6-compat. wget healthcheck'te var.
RUN apk add --no-cache openssl libc6-compat
# Güvenlik: root olmayan kullanıcı.
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
# tsconfig + src: seed script'i (ts-node) için gerekir (seed.ts, src'den sabit import eder).
COPY --from=build /app/tsconfig*.json ./
COPY --from=build /app/src ./src
# app kullanıcısı engine cache vb. yazabilsin (migrate deploy için).
RUN chown -R app:app /app
USER app
EXPOSE 3000
# Başlangıçta migration uygula, sonra uygulamayı çalıştır.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
