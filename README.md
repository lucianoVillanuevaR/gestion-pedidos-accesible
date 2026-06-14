# Sistema Web de Gestión de Pedidos - Riquísimo

Aplicación web interna para una pyme gastronómica. Permite registrar pedidos presenciales, seguir su preparación, administrar productos, controlar stock básico, subir imágenes de productos a MinIO, cerrar turnos y revisar pedidos recientes sin depender de comandas en papel.

El sistema incorpora un modo normal/admin y un modo fácil/accesible orientado a usuarios con bajo manejo tecnológico, utilizando pantallas guiadas, botones grandes, textos directos y reducción de opciones visibles.

---

## Tecnologías

* Frontend: React, TypeScript, Vite y Tailwind CSS.
* Backend: Node.js, Express y TypeScript.
* Base de datos: PostgreSQL con Prisma.
* Archivos: MinIO para imágenes de productos.
* Infraestructura: Docker Compose.
* Servidor frontend: Nginx con proxy `/api`.

---

## Arquitectura

El proyecto se ejecuta mediante Docker Compose con cuatro servicios principales:

* `frontend`: sirve la aplicación web con Nginx y expone el proxy `/api`.
* `backend`: API REST, Prisma, conexión a PostgreSQL, conexión a MinIO y healthcheck.
* `postgres`: base de datos relacional persistente.
* `minio`: almacenamiento persistente de imágenes de productos.

---

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

---

## Variables de entorno

Crear el archivo `.env` desde el ejemplo:

```bash
cp .env.example .env
```

Variables principales:

```env
PORT=3000
CLIENT_URL=http://localhost
JWT_SECRET=clave_demo_cambiar_en_produccion

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

Con Docker, el backend usa `postgres:5432` y `minio:9000` dentro de la red de Compose.

El frontend usa `/api` y Nginx redirige esas llamadas al backend.

En producción se deben cambiar las credenciales demo y usar valores seguros.

---

## Levantar con Docker

Validar configuración:

```bash
docker compose config
```

Construir y levantar servicios:

```bash
docker compose up -d --build
```

Revisar estado:

```bash
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

Importante:

```bash
docker compose down -v
```

borra los volúmenes `postgres_data` y `minio_data`. Eso elimina la base de datos y los archivos guardados. No usarlo salvo que se quiera resetear completamente el entorno de desarrollo.

---

## Persistencia

* PostgreSQL usa el volumen `postgres_data`.
* MinIO usa el volumen `minio_data`.

Esto permite detener y volver a levantar el proyecto sin perder pedidos, productos ni imágenes.

---

## Healthchecks

Comandos de prueba:

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

---

## MinIO

Consola web:

```text
http://localhost:9001
```

Credenciales de desarrollo:

```text
Usuario: admin
Clave: admin123456
```

Las imágenes se suben al backend. El frontend no sube directo a MinIO.

PostgreSQL guarda solo la referencia del objeto, mientras que MinIO conserva el archivo real en el bucket `productos`.

Ejemplo conceptual:

```text
Archivo real: MinIO
Referencia guardada en PostgreSQL: productos/producto-5-1712345678.webp
```

---

## Flujo principal

1. Abrir turno.
2. Crear pedido.
3. Revisar pedidos activos.
4. Enviar a preparación.
5. Marcar pedido listo.
6. Entregar pedido.
7. Cerrar turno.
8. Consultar pedidos recientes o historial.

El total vendido del cierre considera solo pedidos entregados. Los pedidos pendientes no se borran al cerrar turno.

---

## Modos de uso

### Modo normal/admin

El modo normal permite administrar y operar el sistema con acceso completo a las funciones principales.

Incluye:

* Crear y editar productos.
* Cambiar disponibilidad de productos.
* Subir, cambiar y eliminar imágenes.
* Actualizar stock y stock mínimo.
* Revisar pedidos activos.
* Gestionar preparación.
* Revisar historial.
* Cerrar turno.
* Consultar inventario completo.

### Modo fácil/accesible

El modo fácil se orienta a tareas operativas frecuentes mediante pantallas guiadas, botones grandes y textos directos.

Las funciones administrativas se mantienen en el modo normal para evitar sobrecarga visual y reducir errores de configuración.

Incluye:

* Inicio con acciones grandes.
* Crear pedido guiado por pasos.
* Pedidos activos simplificados.
* Preparación simplificada.
* Stock básico con estados simples:

  * Disponible.
  * Queda poco.
  * Sin stock.
* Cierre de turno resumido.
* Pedidos recientes.
* Ver menú solo como consulta, sin edición avanzada.

No permite:

* Crear productos.
* Editar productos.
* Cambiar precios.
* Subir imágenes.
* Crear categorías.
* Crear combos.
* Gestionar usuarios.
* Configurar elementos avanzados.

---

## Módulos principales

* Nuevo pedido: registro de pedidos presenciales desde el punto de venta.
* Pedidos activos: seguimiento de pedidos pendientes, en preparación, listos y entregados.
* Preparación: cola operativa para gestionar pedidos que deben prepararse.
* Cierre de turno: resumen de ventas confirmadas, pedidos pendientes y métodos de pago.
* Historial / pedidos recientes: consulta de turnos cerrados y pedidos registrados.
* Productos: administración del catálogo, disponibilidad e imágenes en modo normal.
* Stock básico / inventario: control simple de disponibilidad, stock actual y stock mínimo.
* Referencias de cliente: nombre o referencia opcional asociada al pedido.

---

## Validaciones principales

### Pedidos

* No permite registrar pedidos vacíos.
* No permite cantidades menores o iguales a cero.
* Valida método de pago.
* Valida producto existente y disponible.
* Valida textos de cliente y observación.
* Valida estados permitidos.

### Estados de pedido

Estados permitidos:

```text
pendiente
en_preparacion
listo
entregado
cancelado
```

Transiciones permitidas:

```text
pendiente -> en_preparacion
pendiente -> cancelado
en_preparacion -> listo
en_preparacion -> cancelado
listo -> entregado
```

### Productos

* Nombre requerido.
* Precio válido.
* Categoría válida.
* Evita nombres duplicados.
* Permite activar o desactivar disponibilidad.

### Imágenes

* Permite JPG, JPEG, PNG y WEBP.
* Límite de tamaño configurado en backend.
* Mensajes claros si falla formato, tamaño o subida.
* El archivo real se guarda en MinIO.
* PostgreSQL guarda solo la referencia.

### Inventario

* No permite stock negativo.
* No permite stock mínimo negativo.
* Calcula estado según stock actual y stock mínimo.

Reglas:

```text
stock_actual <= 0: Sin stock
stock_actual <= stock_minimo: Bajo stock / Queda poco
stock_actual > stock_minimo: Disponible
```

---

## Prisma

Comandos útiles dentro del contenedor:

```bash
docker compose exec backend npx prisma validate
docker compose exec backend npx prisma migrate status
```

Generar Prisma Client:

```bash
docker compose exec backend npx prisma generate
```

No borrar migraciones ni resetear la base sin confirmación explícita.

Consolidar migraciones en una sola migración inicial solo conviene si:

* El proyecto sigue en desarrollo.
* No hay datos reales importantes.
* Nadie depende del historial actual.
* Se acepta resetear la base de datos.
* Se realiza respaldo previo.

---

## Desarrollo sin Docker

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Abrir:

```text
http://localhost:5173
```

En desarrollo local sin Docker, revisar que las variables de entorno apunten a servicios accesibles desde el host.

---

## Verificación de build

### Frontend

```bash
cd frontend
npm run build
```

### Backend

```bash
cd backend
npm run build
```

---

## Pruebas funcionales recomendadas

Después de levantar el proyecto, probar:

1. Iniciar sesión.
2. Abrir turno.
3. Crear pedido.
4. Revisar pedido en pedidos activos.
5. Cambiar pedido a preparación.
6. Marcar pedido como listo.
7. Entregar pedido.
8. Revisar pedidos recientes.
9. Cerrar turno.
10. Revisar historial.
11. Crear o editar producto en modo normal.
12. Subir imagen de producto.
13. Confirmar imagen en MinIO.
14. Revisar stock básico.
15. Activar modo fácil.
16. Crear pedido guiado en modo fácil.
17. Salir del modo fácil.
18. Confirmar que el modo normal sigue funcionando.

---

## Estado actual

* Docker Compose funcional.
* Servicios frontend, backend, PostgreSQL y MinIO con healthchecks.
* Persistencia mediante volúmenes Docker.
* Modo normal/admin implementado.
* Modo fácil/accesible implementado.
* Gestión de pedidos presenciales.
* Preparación de pedidos.
* Gestión de productos e imágenes con MinIO.
* Inventario básico.
* Cierre de turno.
* Historial y pedidos recientes.
* Prisma validado y migraciones aplicadas.
* Build de frontend y backend funcionando.

---

## Nota de seguridad

Las credenciales incluidas son solo para entorno de desarrollo.

Para producción se debe:

* Cambiar `JWT_SECRET`.
* Cambiar credenciales de PostgreSQL.
* Cambiar credenciales de MinIO.
* Usar variables de entorno seguras.
* No exponer claves secretas en el frontend.
* Configurar políticas adecuadas para archivos.
* Usar HTTPS si se despliega públicamente.
