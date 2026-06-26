FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=/api
ARG VITE_MINIO_PUBLIC_URL=http://localhost:9000
ARG VITE_MINIO_BUCKET_PRODUCTOS=productos
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MINIO_PUBLIC_URL=$VITE_MINIO_PUBLIC_URL
ENV VITE_MINIO_BUCKET_PRODUCTOS=$VITE_MINIO_BUCKET_PRODUCTOS

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build


FROM nginx:1.27-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
