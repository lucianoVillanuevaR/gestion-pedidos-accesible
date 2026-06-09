# Sistema de Gestion de Pedidos - Riquisimo

## Docker

Clonar el repositorio:

```bash
git clone https://github.com/lucianoVillanuevaR/gestion-pedidos-accesible.git
cd gestion-pedidos-accesible
```

Crear el archivo de variables de entorno:

```bash
cp .env.example .env
```

Levantar el proyecto:

```bash
docker compose up -d --build
```

URLs:

```text
Frontend: http://localhost
Backend health: http://localhost:3000/api/health
PostgreSQL: localhost:5433
MinIO API: http://localhost:9000
MinIO consola: http://localhost:9001
```

Ver estado y logs:

```bash
docker compose ps
docker compose logs backend
docker compose logs postgres
docker compose logs frontend
```

El backend ejecuta automáticamente `prisma migrate deploy`, `seed` y luego inicia el servidor. PostgreSQL tiene healthcheck con `pg_isready`, y el backend espera a que PostgreSQL esté healthy antes de ejecutar Prisma.

Importante: no ejecutes `docker compose down -v` salvo que quieras borrar la base de datos y los archivos guardados en volúmenes. Para detener sin borrar datos usa:

```bash
docker compose down
```

## Almacenamiento de archivos con MinIO

El proyecto usa MinIO como almacenamiento de objetos compatible con S3. Se usa para guardar imágenes de productos y queda preparado para archivos futuros. PostgreSQL guarda solo la referencia del objeto, por ejemplo:

```text
productos/producto-5-1712345678.webp
```

El archivo real queda en MinIO, dentro del bucket `productos`.

Puertos locales:

```text
9000: API S3 compatible
9001: consola web
```

Credenciales demo de desarrollo:

```text
Usuario: admin
Clave: admin123456
```

Variables de entorno usadas por el backend:

```env
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=admin123456
MINIO_BUCKET_PRODUCTOS=productos
MINIO_USE_SSL=false
MINIO_PUBLIC_URL=http://localhost:9000
```

Con Docker, el backend debe usar `MINIO_ENDPOINT=minio`, porque se conecta al servicio de Docker Compose. Sin Docker, usa `MINIO_ENDPOINT=localhost`.

Para probar la subida de imagen:

1. Levantar el proyecto con `docker compose up --build`.
2. Entrar al sistema como administrador.
3. Ir a Productos en modo normal.
4. Editar un producto.
5. Usar “Subir imagen” o “Cambiar imagen”.
6. Confirmar que la imagen se muestra en el catálogo.
7. Revisar la consola MinIO en `http://localhost:9001`.
8. Confirmar que PostgreSQL guarda solo `imagen_url`, no el archivo binario.

En producción se deben cambiar las credenciales demo de MinIO y no usar `admin/admin123456`.

## Sin Docker

Requisitos:

```text
Node.js
npm
PostgreSQL
```

Crear usuario y base de datos en PostgreSQL:

```sql
CREATE USER admin WITH PASSWORD 'admin123';
CREATE DATABASE sistema_pedidos OWNER admin;
```

Crear o editar `backend/.env`:

```env
DATABASE_URL=postgresql://admin:admin123@localhost:5432/sistema_pedidos
PORT=3001
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=admin123456
MINIO_BUCKET_PRODUCTOS=productos
MINIO_USE_SSL=false
MINIO_PUBLIC_URL=http://localhost:9000
```

Levantar el backend:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

Comandos útiles del backend:

```bash
npx prisma generate
npx prisma migrate dev
npm run seed
npm run build
```

En otra terminal, levantar el frontend:

```bash
cd frontend
npm install
npm run dev
```

Abrir:

```text
http://localhost:5173
```

Si el frontend en desarrollo no encuentra el backend, define el proxy de Vite:

```env
VITE_API_PROXY_TARGET=http://localhost:3001
```

Si Docker falla:

1. Revisa `docker compose ps`.
2. Revisa `docker compose logs backend`.
3. Confirma que `DATABASE_URL` dentro de Docker use `postgres:5432`, no `localhost`.
4. Confirma que PostgreSQL esté healthy.
5. Confirma que MinIO esté disponible en `http://localhost:9001`.
