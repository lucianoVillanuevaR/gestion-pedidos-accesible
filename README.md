# Sistema de Gestion de Pedidos - Riquisimo

Aplicacion web interna para una pyme gastronomica. Permite registrar pedidos presenciales, seguir su preparacion, administrar productos, controlar stock basico, subir imagenes de productos a MinIO y cerrar turnos sin depender de comandas en papel.

## Arquitectura

- Frontend: React, TypeScript, Vite y Tailwind.
- Backend: Node.js, Express y TypeScript.
- Base de datos: PostgreSQL con Prisma.
- Archivos: MinIO para imagenes de productos.
- Infraestructura: Docker Compose.

Servicios principales:

- `frontend`: sirve la aplicacion en Nginx y proxy `/api`.
- `backend`: API REST, Prisma, MinIO y healthcheck.
- `postgres`: base persistente.
- `minio`: almacenamiento persistente de imagenes.

## Puertos

```text
Frontend: http://localhost
Backend health: http://localhost:3000/api/health
Proxy health: http://localhost/api/health
PostgreSQL: localhost:5433
MinIO API: http://localhost:9000
MinIO consola: http://localhost:9001
```

## Variables De Entorno

Copia el ejemplo:

```bash
cp .env.example .env
```

Variables relevantes:

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

Con Docker, el backend usa `MINIO_ENDPOINT=minio` y `DATABASE_URL` apuntando a `postgres:5432`. Sin Docker, usa `localhost`.

## Levantar Con Docker

```bash
docker compose config
docker compose up -d --build
docker compose ps
```

Ver logs:

```bash
docker compose logs backend
docker compose logs frontend
docker compose logs postgres
docker compose logs minio
```

Detener sin borrar datos:

```bash
docker compose down
```

Importante: `docker compose down -v` borra los volumenes `postgres_data` y `minio_data`. No usarlo salvo que se quiera eliminar la base de datos y los archivos guardados.

## Persistencia

PostgreSQL usa el volumen `postgres_data`.
MinIO usa el volumen `minio_data`.

Esto permite detener y volver a levantar el proyecto sin perder pedidos, productos ni imagenes.

## Healthchecks

```bash
curl http://localhost
curl http://localhost:3000/api/health
curl http://localhost/api/health
```

Resultado esperado del backend:

```json
{
  "status": "ok"
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

Las imagenes se suben al backend. El frontend no sube directo a MinIO. PostgreSQL guarda solo la referencia, por ejemplo:

```text
productos/producto-5-1712345678.webp
```

El archivo real queda en el bucket `productos`.

## PostgreSQL Desde pgAdmin O DBeaver

```text
Host: localhost
Puerto: 5433
Base de datos: sistema_pedidos
Usuario: admin
Clave: admin123
```

## Flujo Principal Del Sistema

1. Crear pedido desde Punto de Venta.
2. Agregar productos y metodo de pago.
3. Enviar pedido a preparacion.
4. Marcar pedido en preparacion.
5. Marcar pedido listo.
6. Entregar pedido.
7. Revisar historial.
8. Cerrar turno.

El total vendido del cierre considera solo pedidos entregados. Los pedidos pendientes no se borran al cerrar turno.

## Modos De Uso

Modo normal/admin:

- Crear y editar productos.
- Cambiar disponibilidad.
- Subir, cambiar y eliminar imagenes.
- Actualizar stock y stock minimo.
- Revisar pedidos, preparacion, historial y cierre de turno.

Modo facil/accesible:

- Flujo guiado para nuevo pedido.
- Botones grandes.
- Mensajes claros.
- Pedidos activos simplificados.
- Preparacion simplificada.
- Stock basico con estados simples: Disponible, Queda poco, Sin stock.
- Productos solo de consulta, sin creacion ni edicion.

## Modulos

- Nuevo Pedido: registro de pedidos presenciales.
- Pedidos: pedidos activos, filtros y cambios de estado.
- Cocina/Preparacion: cola operativa de pedidos pendientes, en preparacion y listos.
- Historial de pedidos: turnos cerrados y pedidos guardados.
- Productos: catalogo, disponibilidad e imagenes.
- Inventario: stock actual, stock minimo y estado por producto.
- Clientes: resumen derivado de pedidos.

## Validaciones Principales

Pedidos:

- No permite pedido vacio.
- No permite cantidades menores o iguales a cero.
- Valida metodo de pago.
- Valida producto existente y disponible.
- Valida textos de cliente y observacion.

Estados:

- Solo acepta estados validos.
- Permite transiciones logicas:
  - `pendiente -> en_preparacion`
  - `pendiente -> cancelado`
  - `en_preparacion -> listo`
  - `en_preparacion -> cancelado`
  - `listo -> entregado`

Productos:

- Nombre requerido.
- Precio entre 0 y el maximo permitido.
- Categoria valida.
- Evita nombres duplicados.

Imagenes:

- Permite JPG, JPEG, PNG y WEBP.
- Limite de tamano configurado en backend.
- Mensajes claros si falla formato, tamano o subida.

Inventario:

- No permite stock negativo.
- No permite stock minimo negativo.
- Estados:
  - `stock_actual <= 0`: Sin stock.
  - `stock_actual <= stock_minimo`: Bajo stock.
  - `stock_actual > stock_minimo`: Disponible.

## Prisma

Comandos utiles dentro del contenedor:

```bash
docker compose exec backend npx prisma validate
docker compose exec backend npx prisma migrate status
```

No borrar migraciones ni resetear la base sin confirmacion.

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

## Prueba Rapida Para Demostracion

1. `docker compose up -d --build`.
2. Iniciar sesion con un usuario demo.
3. Crear un pedido en Nuevo Pedido.
4. Verlo en Pedidos.
5. Cambiar estado a En preparacion.
6. Abrir Cocina/Preparacion.
7. Marcar Listo y luego Entregado.
8. Ver historial.
9. Cerrar turno.
10. Crear o editar producto.
11. Subir imagen.
12. Ver imagen en modo facil.
13. Confirmar archivo en MinIO.
14. Confirmar datos persistentes en PostgreSQL.

## Usuarios Demo

```text
cajero / 123456
cocina / 123456
admin / 123456
```
