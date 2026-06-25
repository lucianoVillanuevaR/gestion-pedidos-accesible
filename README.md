# Sistema Web de Gestión de Pedidos - Riquísimo

Aplicación web para gestión de pedidos, productos, stock básico, preparación, cierre de turno e imágenes de productos con MinIO. Incluye modo normal y modo fácil/accesible.

## Levantar desde cero

```bash
git clone https://github.com/lucianoVillanuevaR/gestion-pedidos-accesible.git
cd gestion-pedidos-accesible
cp .env.example .env
nano .env
docker compose up -d --build
docker compose run --rm seed
docker compose ps
curl http://localhost/api/health
```

En Docker, `DATABASE_URL` debe usar el host interno `postgres:5432`, no `localhost:5433`.
Antes de usarlo fuera de una demo local, cambia `POSTGRES_PASSWORD`, `JWT_SECRET`, `MINIO_ACCESS_KEY` y `MINIO_SECRET_KEY`.

## Puertos

```text
Frontend:       http://localhost
Backend health: http://localhost/api/health
Postgres:       localhost:5433    dentro de Docker: postgres:5432
MinIO consola:  http://localhost:9001
MinIO API:      http://localhost:9000
```

El frontend también expone el backend por proxy en:

```bash
curl http://localhost/api/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "message": "Backend running"
}
```

## Seed

El seed se ejecuta dentro del contenedor:

```bash
docker compose run --rm seed
```

El proceso aplica migraciones pendientes, crea/verifica el bucket de MinIO y sincroniza datos base sin duplicar usuarios, categorías, productos, variantes ni componentes. También crea usuarios demo si no existen.

Usuarios demo:

```text
cajero / 123456
cocina / 123456
admin  / 123456
```

La clave se puede cambiar en `.env` con `SEED_DEMO_PASSWORD`.

## Servicios

Docker Compose mantiene estos servicios:

```text
frontend
backend
postgres
minio
seed
```

`postgres` tiene healthcheck obligatorio. El backend espera a `postgres` con `condition: service_healthy`. MinIO y frontend no tienen healthcheck.

## Comandos útiles

Ver estado:

```bash
docker compose ps
```

Ver logs:

```bash
docker compose logs --tail=80 backend
docker compose logs --tail=80 frontend
docker compose logs --tail=80 postgres
docker compose logs --tail=80 minio
```

Detener sin borrar datos:

```bash
docker compose down
```

Reiniciar completamente:

```bash
docker compose down -v
```

Atención: `docker compose down -v` borra los volúmenes `postgres_data` y `minio_data`. Eso elimina la base de datos y los archivos guardados en MinIO.

## Validación rápida

Después de levantar y ejecutar el seed:

```bash
curl http://localhost/api/health
```

Luego abrir:

```text
http://localhost
```

Verificar login con un usuario demo, productos iniciales, modo normal, modo fácil y consola MinIO en `http://localhost:9001`.
