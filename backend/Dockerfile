FROM node:22-alpine AS builder

WORKDIR /app

# Necesario para Prisma en Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .

# Generar cliente Prisma y compilar TypeScript
RUN npm run prisma:generate
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN npm run prisma:generate

EXPOSE 3000

CMD ["sh", "-c", "npm run prisma:migrate:prod && npm start"]

