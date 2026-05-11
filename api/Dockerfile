# Image production NestJS + Prisma (migrations au démarrage).
# Contexte de build : dossier api/

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate && npm run build

# --- Runtime : régénère le client Prisma pour l’image finale ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Prisma sur Alpine : moteurs OpenSSL cohérents (évite les warnings / erreurs au runtime)
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev && npx prisma generate

COPY --from=builder /app/dist ./dist

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
