# Sistema Web de Gestión de Pedidos - Riquísimo

Aplicación web para gestión de pedidos, productos, stock básico, preparación, cierre de turno e imágenes de productos con MinIO. Incluye modo normal y modo fácil/accesible.

## Levantar desde cero

```bash
git clone https://github.com/lucianoVillanuevaR/gestion-pedidos-accesible.git
cd gestion-pedidos-accesible
cp .env.example .env
nano .env
docker compose --profile tools run --rm --build seed
docker compose up -d --build --wait
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
5. Conserva `MINIO_PUBLIC_URL=/media` y `VITE_MINIO_PUBLIC_URL=/media`; Nginx entrega las imágenes bajo el mismo origen sin publicar MinIO.
6. Levanta con `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --wait`. El servicio `migrate` aplica únicamente migraciones pendientes antes de iniciar el backend; producción nunca ejecuta datos demo automáticamente.
7. Crea el primer administrador mediante el comando explícito documentado abajo.
8. Verifica `docker compose ps`, `curl https://tudominio.cl/health` y `curl https://tudominio.cl/api/health`.

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

## Migraciones, catálogo inicial y primer administrador

Las migraciones se ejecutan automáticamente al levantar Docker. El catálogo y los usuarios demo son una importación explícita, exclusiva de desarrollo:

```bash
docker compose --profile tools run --rm --build seed
```

El seed es idempotente y no destructivo: solo crea registros ausentes. Nunca desactiva productos creados por el administrador, no sobrescribe precios ni categorías y no reemplaza variantes o componentes existentes.

Usuarios demo:

```text
cajero / valor de SEED_DEMO_PASSWORD
cocina / valor de SEED_DEMO_PASSWORD
admin  / valor de SEED_DEMO_PASSWORD
```

Para crear el primer administrador de una instalación real:

```bash
docker compose exec backend npm run admin:create -- \
  --username=administrador \
  --email=admin@institucion.cl \
  --nombre="Administrador" \
  --password="una-clave-larga-y-segura"
```

El comando valida los datos, cifra la contraseña con bcrypt e impide duplicados. No existe un endpoint público de registro.

Si una base antigua tiene un producto con control de stock pero sin inventario, ejecutar explícitamente:

```bash
docker compose exec backend npm run inventory:repair
```

## Servicios

Docker Compose mantiene estos servicios:

```text
frontend
backend
postgres
minio
migrate
seed (solo perfil tools)
```

`postgres`, `backend` y `frontend` tienen healthcheck. El flujo normal es `postgres → migrate → backend → frontend`. El `seed` pertenece al perfil opcional `tools` y nunca es requisito para iniciar producción.

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

No uses en producción salvo que realmente quieras borrar todos los datos:

```bash
docker compose down -v
```

Atención: `docker compose down -v` borra los volúmenes `postgres_data` y `minio_data`. Eso elimina la base de datos y los archivos guardados en MinIO.

## Backups básicos

PostgreSQL:

```bash
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > respaldo.sql
```

MinIO: respalda el volumen `minio_data` o sincroniza el bucket `productos` con `mc mirror`. Para recuperar, restaura primero PostgreSQL y después el contenido del bucket, manteniendo los mismos nombres de objeto.

## HTTPS

El contenedor Nginx atiende HTTP. HTTPS y HSTS deben configurarse en el proxy o balanceador institucional que termina TLS. Publica solamente 80/443; backend, PostgreSQL y la consola/API de MinIO deben permanecer privados.

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
