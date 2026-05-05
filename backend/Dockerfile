FROM node:22-alpine

WORKDIR /app

# Necesario para Prisma en Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install

COPY . .

# Generar cliente Prisma
RUN npm run prisma:generate

EXPOSE 3000

CMD ["sh", "-c", "npm run prisma:migrate:prod && npm run seed && npm run dev"]




