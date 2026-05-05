# Integración de Prisma - Sistema Riquísimo

## Estructura completada

```
backend/
├── prisma/
│   ├── schema.prisma          # Modelos de datos (Producto, Pedido, DetallePedido)
│   ├── seed.ts                # Script para insertar datos iniciales
│   └── migrations/
│       └── 1_init/
│           └── migration.sql  # Migración inicial
├── src/
│   ├── config/
│   │   ├── env.ts            # Variables de entorno (existente)
│   │   └── prisma.ts         # Cliente Prisma reutilizable
│   ├── controllers/
│   │   ├── health.controller.ts     # (existente)
│   │   ├── productos.controller.ts  # GET productos
│   │   └── pedidos.controller.ts    # CRUD pedidos con validaciones
│   ├── routes/
│   │   ├── index.ts           # Rutas principales
│   │   ├── health.routes.ts   # (existente)
│   │   ├── productos.routes.ts
│   │   └── pedidos.routes.ts
│   └── server.ts              # (existente)
├── Dockerfile                 # Actualizado con migraciones y seed
├── package.json               # Con nuevos scripts
└── tsconfig.json              # (sin cambios necesarios)
```

## Modelos Prisma

### Producto
- `id` (Int) - PK
- `nombre` (String) - Único
- `descripcion` (String)
- `precio` (Decimal)
- `disponible` (Boolean)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Pedido
- `id` (Int) - PK
- `total` (Decimal)
- `estado` (String) - Valores válidos: `pendiente`, `en_preparacion`, `listo`, `entregado`, `cancelado`
- `metodoPago` (String) - Valores válidos: `efectivo`, `tarjeta`, `transferencia`
- `observacion` (String)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- `detalles` (DetallePedido[]) - Relación

### DetallePedido
- `id` (Int) - PK
- `pedidoId` (Int) - FK → Pedido (Cascade)
- `productoId` (Int) - FK → Producto
- `cantidad` (Int)
- `precioUnitario` (Decimal)
- `subtotal` (Decimal)

## Scripts disponibles

```bash
# Desarrollo
npm run dev                # Iniciar servidor con hot-reload

# Prisma
npm run prisma:generate   # Generar cliente Prisma
npm run prisma:migrate    # Crear y ejecutar migraciones (dev)
npm run prisma:migrate:prod # Ejecutar migraciones existentes (prod)
npm run prisma:studio     # Abrir Prisma Studio (interfaz gráfica)
npm run seed              # Ejecutar seed.ts

# Build
npm run build             # Compilar TypeScript
npm run start             # Iniciar servidor compilado
```

## Endpoints API

### Productos
```
GET  /api/productos         # Obtener todos los productos
GET  /api/productos/:id     # Obtener producto por ID
```

Respuesta:
```json
{
  "id": 1,
  "nombre": "Hamburguesa Clásica",
  "descripcion": "Hamburguesa con carne, lechuga, tomate y cebolla",
  "precio": "8.50",
  "disponible": true,
  "createdAt": "2025-05-04T10:30:00Z",
  "updatedAt": "2025-05-04T10:30:00Z"
}
```

### Pedidos
```
POST /api/pedidos           # Crear pedido
GET  /api/pedidos           # Obtener todos los pedidos
GET  /api/pedidos/:id       # Obtener pedido por ID
PATCH /api/pedidos/:id/estado # Actualizar estado del pedido
```

**POST /api/pedidos** - Crear pedido:
```json
{
  "detalles": [
    {
      "productoId": 1,
      "cantidad": 2
    },
    {
      "productoId": 3,
      "cantidad": 1
    }
  ],
  "metodoPago": "efectivo",
  "observacion": "Sin cebolla en la hamburguesa"
}
```

Respuesta (201 Created):
```json
{
  "id": 1,
  "total": "19.50",
  "estado": "pendiente",
  "metodoPago": "efectivo",
  "observacion": "Sin cebolla en la hamburguesa",
  "createdAt": "2025-05-04T10:35:00Z",
  "updatedAt": "2025-05-04T10:35:00Z",
  "detalles": [
    {
      "id": 1,
      "pedidoId": 1,
      "productoId": 1,
      "cantidad": 2,
      "precioUnitario": "8.50",
      "subtotal": "17.00",
      "producto": {
        "id": 1,
        "nombre": "Hamburguesa Clásica",
        "descripcion": "...",
        "precio": "8.50",
        "disponible": true,
        "createdAt": "2025-05-04T10:30:00Z",
        "updatedAt": "2025-05-04T10:30:00Z"
      }
    },
    ...
  ]
}
```

**PATCH /api/pedidos/:id/estado** - Cambiar estado:
```json
{
  "estado": "en_preparacion"
}
```

## 🐳 Ejecución en Docker

El flujo automático en Docker es:

1. Construir imagen
2. Instalar dependencias
3. Generar cliente Prisma
4. Ejecutar migraciones (prisma migrate deploy)
5. Ejecutar seed (insertar productos iniciales)
6. Iniciar servidor

**Comandos:**

```bash
# Construir y levantar servicios
docker-compose up --build

# Solo frontend
docker-compose up frontend --build

# Solo backend
docker-compose up backend --build

# Logs en tiempo real
docker-compose logs -f backend

# Ejecutar comando en contenedor
docker-compose exec backend npm run seed

# Reiniciar
docker-compose restart backend
```

## ✋ Pasos finales de prueba (sin Docker)

**1. Verificar conexión a PostgreSQL (debe estar corriendo)**

```bash
# En otra terminal, si no tiene Docker corriendo
# O use: docker-compose up postgres
```

**2. Instalar dependencias**

```bash
cd backend
npm install
```

**3. Generar cliente Prisma**

```bash
npm run prisma:generate
```

**4. Ejecutar migraciones**

```bash
npm run prisma:migrate:prod
# O: npm run prisma:migrate (modo desarrollo interactivo)
```

**5. Insertar datos iniciales**

```bash
npm run seed
```

**6. Iniciar servidor**

```bash
npm run dev
```

**7. Probar endpoints**

```bash
# Terminal 3: Probar APIs
curl http://localhost:3000/api/health

curl http://localhost:3000/api/productos

curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "detalles": [{"productoId": 1, "cantidad": 2}],
    "metodoPago": "efectivo"
  }'

curl http://localhost:3000/api/pedidos

curl http://localhost:3000/api/pedidos/1

curl -X PATCH http://localhost:3000/api/pedidos/1/estado \
  -H "Content-Type: application/json" \
  -d '{"estado": "listo"}'
```

## Validaciones implementadas

 **Cantidad de productos**: Debe ser > 0  
 **Producto existente**: Valida que el producto exista en BD  
 **Producto disponible**: Solo permite productos con `disponible: true`  
 **Estado válido**: `pendiente`, `en_preparacion`, `listo`, `entregado`, `cancelado`  
**Método de pago válido**: `efectivo`, `tarjeta`, `transferencia`  
 **Cálculo de total**: Suma automática de subtotales  
 **Detalles no vacíos**: Al menos un producto en el pedido  

## Variables de entorno (.env)

```env
POSTGRES_DB=sistema_pedidos
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123

DATABASE_URL=postgresql://admin:admin123@postgres:5432/sistema_pedidos

JWT_SECRET=clave_super_secreta_riquisimo
PORT=3000
CLIENT_URL=http://localhost:5173

VITE_API_URL=http://localhost:3000/api
```

## Troubleshooting

### Error: "Can't reach database server"
- Asegúrese que PostgreSQL está corriendo
- Con Docker: `docker-compose up postgres`
- Con máquina local: Verificar que postgres está activo

### Error: "relation does not exist"
- Ejecutar migraciones: `npm run prisma:migrate:prod`
- En Docker se ejecutan automáticamente

### Error: "duplicate key value violates unique constraint"
- Los productos tienen nombres únicos
- Limpiar BD: `npm run seed` (borra y recrea datos)

### No hay datos en la BD
- Ejecutar seed: `npm run seed`
- Verificar en Prisma Studio: `npm run prisma:studio`

## 🎓 Productos iniciales en seed.ts

1. Hamburguesa Clásica - $8.50
2. Completo Italiano - $7.50
3. Papas Fritas - $3.50
4. Bebida - $2.00
5. Chacarero - $8.00
6. Barros Luco - $9.00
7. Arma tu Sandwich - $7.00
8. Sandwich Luco Patrón - $10.00

##  Recursos útiles

- [Prisma Docs](https://www.prisma.io/docs/)
- [PostgreSQL en Docker](https://hub.docker.com/_/postgres)
- [Express + TypeScript](https://expressjs.com/)
