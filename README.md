# Sistema de Gestión de Pedidos - Riquísimo

Aplicación web interna para una pyme gastronómica. Permite registrar pedidos presenciales, seguir su preparación, administrar productos, controlar stock básico, subir imágenes de productos a MinIO, cerrar turnos y revisar pedidos recientes sin depender de comandas en papel.

## Tecnologías

- Frontend: React, TypeScript, Vite y Tailwind.
- Backend: Node.js, Express y TypeScript.
- Base de datos: PostgreSQL con Prisma.
- Archivos: MinIO para imágenes de productos.
- Infraestructura: Docker Compose.

## Arquitectura

- `frontend`: sirve la aplicación en Nginx y expone el proxy `/api`.
- `backend`: API REST, Prisma, conexión a MinIO y healthcheck.
- `postgres`: base de datos persistente.
- `minio`: almacenamiento persistente de imágenes.

## Puertos

```text
Frontend: http://localhost
Backend health: http://localhost:3000/api/health
Proxy health: http://localhost/api/health
PostgreSQL host: localhost:5433
PostgreSQL Docker: postgres:5432
MinIO API: http://localhost:9000
MinIO consola: http://localhost:9001
```

## Variables De Entorno

```bash
cp .env.example .env
```

Variables principales:

```env
PORT=3000
CLIENT_URL=http://localhost
DATABASE_URL=postgresql://admin:admin123@postgres:5432/sistema_pedidos
POSTGRES_DB=sistema_pedidos
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=admin123456
MINIO_BUCKET_PRODUCTOS=productos
MINIO_USE_SSL=false
MINIO_PUBLIC_URL=http://localhost:9000
```

Con Docker, el backend usa `postgres:5432` y `minio:9000` dentro de la red de Compose. El frontend usa `/api` y Nginx redirige esas llamadas al backend.

## Levantar Con Docker

```bash
docker compose config
docker compose up -d --build
docker compose ps
```

Logs útiles:

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

Importante: `docker compose down -v` borra los volúmenes `postgres_data` y `minio_data`. Eso elimina la base de datos y los archivos guardados. No usarlo salvo que se quiera resetear completamente el entorno de desarrollo.

## Persistencia

- PostgreSQL usa el volumen `postgres_data`.
- MinIO usa el volumen `minio_data`.

Esto permite detener y volver a levantar el proyecto sin perder pedidos, productos ni imágenes.

## Healthchecks

```bash
curl http://localhost
curl http://localhost:3000/api/health
curl http://localhost/api/health
```

Respuesta esperada del backend:

```json
{
  "status": "ok",
  "message": "Backend running"
}
```

## MinIO

Consola:

```text
http://localhost:9001
```

Credenciales de desarrollo:

```text
Usuario: admin
Clave: admin123456
```

Las imágenes se suben al backend. El frontend no sube directo a MinIO. PostgreSQL guarda la referencia del objeto y MinIO conserva el archivo real en el bucket `productos`.

## Flujo Principal

1. Abrir turno.
2. Crear pedido.
3. Revisar pedidos activos.
4. Enviar a preparación.
5. Marcar pedido listo.
6. Entregar pedido.
7. Cerrar turno.
8. Consultar pedidos recientes o historial.

El total vendido del cierre considera solo pedidos entregados. Los pedidos pendientes no se borran al cerrar turno.

## Modos De Uso

### Modo normal/admin

- Crear y editar productos.
- Cambiar disponibilidad.
- Subir, cambiar y eliminar imágenes.
- Actualizar stock y stock mínimo.
- Revisar pedidos, preparación, historial y cierre de turno.

### Modo fácil/accesible

El modo fácil se orienta a tareas operativas frecuentes mediante pantallas guiadas, botones grandes y textos directos. Las funciones administrativas se mantienen en el modo normal para evitar sobrecarga visual y reducir errores de configuración.

- Inicio con acciones grandes.
- Crear pedido guiado por pasos.
- Pedidos activos simplificados.
- Preparación simplificada.
- Stock básico con estados simples: Disponible, Queda poco, Sin stock.
- Cierre de turno resumido.
- Pedidos recientes.
- Ver menú solo como consulta, sin edición avanzada.

## Módulos

- Nuevo pedido: registro de pedidos presenciales.
- Pedidos activos: seguimiento, filtros simples y cambios de estado.
- Preparación: cola operativa de pedidos pendientes, en preparación y listos.
- Pedidos recientes / historial: turnos cerrados y pedidos guardados.
- Productos: catálogo, disponibilidad e imágenes en modo normal.
- Stock básico / inventario: stock actual, stock mínimo y estado por producto.
- Clientes: resumen derivado de pedidos.

## Validaciones Principales

Pedidos:

- No permite pedido vacío.
- No permite cantidades menores o iguales a cero.
- Valida método de pago.
- Valida producto existente y disponible.
- Valida textos de cliente y observación.

Estados:

- Solo acepta estados válidos.
- Permite transiciones lógicas:
  - `pendiente -> en_preparacion`
  - `pendiente -> cancelado`
  - `en_preparacion -> listo`
  - `en_preparacion -> cancelado`
  - `listo -> entregado`

Productos:

- Nombre requerido.
- Precio entre 0 y el máximo permitido.
- Categoría válida.
- Evita nombres duplicados.

Imágenes:

- Permite JPG, JPEG, PNG y WEBP.
- Límite de tamaño configurado en backend.
- Mensajes claros si falla formato, tamaño o subida.

Inventario:

- No permite stock negativo.
- No permite stock mínimo negativo.
- Estados:
  - `stock_actual <= 0`: Sin stock.
  - `stock_actual <= stock_minimo`: Bajo stock / Queda poco.
  - `stock_actual > stock_minimo`: Disponible.

## Prisma

Comandos útiles dentro del contenedor:

```bash
docker compose exec backend npx prisma validate
docker compose exec backend npx prisma migrate status
```

No borrar migraciones ni resetear la base sin confirmación explícita. Consolidar migraciones en una sola migración inicial solo conviene si el proyecto sigue en desarrollo, no hay datos reales importantes, nadie depende del historial actual y se acepta resetear la base de datos.

## Desarrollo Sin Docker

Backend:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Abrir:

```text
http://localhost:5173
```
