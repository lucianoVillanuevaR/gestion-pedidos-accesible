# Sistema Web de Gestión de Pedidos - Riquísimo

Aplicación web para gestión de pedidos, productos, stock básico, preparación, cierre de turno e imágenes de productos con MinIO. Incluye modo normal y modo fácil/accesible.

## Levantar desde cero

```bash
git clone https://github.com/lucianoVillanuevaR/gestion-pedidos-accesible.git
cd gestion-pedidos-accesible
cp .env.example .env
nano .env
docker compose up -d --build
docker compose ps
curl http://localhost/api/health
```

En Docker, `DATABASE_URL` debe usar el host interno `postgres:5432`, no `localhost:5433`.
Antes de usarlo fuera de una demo local, cambia `POSTGRES_PASSWORD`, `JWT_SECRET`, `MINIO_ACCESS_KEY` y `MINIO_SECRET_KEY`.

## Preparar servidor

Para subirlo a un servidor con el `docker-compose.yml` incluido:

1. Apunta el dominio al servidor y deja el proxy externo o firewall exponiendo solo HTTP/HTTPS públicos.
2. Copia `.env.example` a `.env` en el servidor y cambia todos los secretos de demo.
3. Configura `CLIENT_URL` con la URL pública del frontend, por ejemplo `https://tudominio.cl`.
4. Si el frontend y backend van juntos detrás del Nginx incluido, deja `VITE_API_URL=/api`.
5. Configura `MINIO_PUBLIC_URL` y `VITE_MINIO_PUBLIC_URL` con la URL pública desde donde el navegador cargará imágenes. Si no vas a exponer MinIO directamente, ponlo detrás de HTTPS con proxy.
6. Levanta con `docker compose up -d --build`. El servicio `seed` aplica migraciones y sincroniza los datos base automáticamente antes de iniciar el backend.
7. Verifica `docker compose ps`, `curl https://tudominio.cl/health` y `curl https://tudominio.cl/api/health`.

Para producción puedes usar el override incluido, que deja públicos solo los puertos del frontend y mantiene backend, Postgres y MinIO dentro de la red Docker:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Recomendaciones antes de producción real:

- No publiques los puertos `3000`, `5433`, `9000` ni `9001` a internet salvo que tengas una razón clara y reglas de firewall.
- Usa contraseñas largas para Postgres, JWT y MinIO.
- Activa backups de los volúmenes `postgres_data` y `minio_data`.
- Configura HTTPS con el proxy del servidor, por ejemplo Nginx Proxy Manager, Caddy, Traefik o Nginx del host.
- Guarda el `.env` fuera de git y conserva una copia segura de recuperación.

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

El seed se ejecuta automáticamente dentro del contenedor al correr:

```bash
docker compose up -d --build
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

`postgres`, `backend` y `frontend` tienen healthcheck. El backend espera a que `seed` termine con éxito, para que la app quede lista al abrir `http://localhost`.

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

Después de levantar:

```bash
curl http://localhost/api/health
```

Luego abrir:

```text
http://localhost
```

Verificar login con un usuario demo, productos iniciales, modo normal, modo fácil y consola MinIO en `http://localhost:9001`.
