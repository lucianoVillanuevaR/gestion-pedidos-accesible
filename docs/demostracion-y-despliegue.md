# Demostración local y despliegue institucional

La demostración usa `docker-compose.demo.yml` con puertos, base de datos y volúmenes propios. No
ejecutes los comandos de seed de este documento sobre una instalación de producción. Conserva
`.env.demo` fuera de Git y elige una contraseña de demostración distinta de las credenciales reales.

## Demostración local

1. Copia `.env.demo.example` a `.env.demo` y define `SEED_DEMO_PASSWORD` con una contraseña local.
2. Crea las cuentas y el catálogo originales en el proyecto aislado:

   ```bash
   docker compose --env-file .env.demo -f docker-compose.demo.yml --profile tools run --rm --build seed npm run seed:demo-users
   ```

3. Inicia los servicios y comprueba los healthchecks:

   ```bash
   docker compose --env-file .env.demo -f docker-compose.demo.yml up -d --build --wait
   docker compose --env-file .env.demo -f docker-compose.demo.yml ps
   curl http://localhost:18081/api/health/ready
   ```

4. Sincroniza las ocho fotografías originales una sola vez. El script conserva las URLs y los objetos
   existentes, verifica SHA-256 y no reemplaza fotos subidas por un administrador:

   ```bash
   docker compose --env-file .env.demo -f docker-compose.demo.yml --profile tools run --rm seed npm run catalog:images:sync -- --apply
   ```

5. Para generar los pedidos simulados, ejecuta el seed protegido solo en esta base de demostración:

   ```bash
   docker compose --env-file .env.demo -f docker-compose.demo.yml --profile tools run --rm seed npm run seed:demo
   ```

La aplicación queda en `http://localhost:18081`. Ejecutar nuevamente los seeds protegidos no debe
reemplazar productos, precios, fotografías ni pedidos ya presentes. Antes de reiniciar o actualizar,
haz una copia de seguridad de los volúmenes PostgreSQL y MinIO. No uses `down -v` para detener la
demostración: borraría los volúmenes de este proyecto.

## Instalación institucional

Para UBB u otro servidor, usa `.env` con credenciales propias, `CLIENT_URL` público y HTTPS en el
proxy. Ejecuta `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --wait`
para aplicar migraciones pendientes e iniciar servicios. Crea la primera cuenta administradora con
`npm run admin:create` y variables `ADMIN_*` temporales según el README. La configuración productiva
no ejecuta cuentas ni pedidos demo automáticamente. Verifica `/health`, `/api/health/ready` y una
lectura de imagen bajo `/media/productos/` antes de abrir el acceso a usuarios. Respalda juntos los
volúmenes de PostgreSQL y MinIO; restaura en un entorno de prueba antes de usar el procedimiento en
producción.
