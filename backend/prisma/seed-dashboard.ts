/// <reference types="node" />
import { Prisma, PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

dotenv.config({ path: resolve(process.cwd(), "../.env") });

// El .env raíz usa el hostname interno de Compose. Al ejecutar npm directamente
// desde el host, PostgreSQL está publicado por docker-compose.yml en el puerto 5433.
if (!existsSync("/.dockerenv") && process.env.DATABASE_URL) {
  const databaseUrl = new URL(process.env.DATABASE_URL);
  if (databaseUrl.hostname === "postgres") {
    databaseUrl.hostname = "localhost";
    databaseUrl.port = process.env.POSTGRES_HOST_PORT?.trim() || "5433";
    process.env.DATABASE_URL = databaseUrl.toString();
  }
}

const prisma = new PrismaClient();

const MARKER = "[SEED_DASHBOARD_V1]";
const CUSTOMER_NAME = `${MARKER} Cliente local`;
const BUSINESS_TIME_ZONE = "America/Santiago";
const ORDER_COUNTS = [12, 15, 9, 18, 11, 14, 16];
const PAYMENT_METHODS = [
  ...Array(40).fill("efectivo"),
  ...Array(45).fill("tarjeta"),
  ...Array(15).fill("transferencia")
] as string[];

type InventorySnapshot = {
  id: number;
  stockActual: number;
  stockMinimo: number;
  seededStockActual: number;
  seededStockMinimo: number;
};

type MarkerMetadata = { inventorySnapshot: InventorySnapshot[] };

type DateParts = { year: number; month: number; day: number };

function zonedDateParts(date: Date): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day") };
}

function addDays(parts: DateParts, days: number): DateParts {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}

function timeZoneOffset(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return (
    Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second")) -
    Math.floor(date.getTime() / 1000) * 1000
  );
}

function localDateTimeToUtc(parts: DateParts, hour: number, minute: number) {
  const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute);
  let result = new Date(localAsUtc - timeZoneOffset(new Date(localAsUtc)));
  result = new Date(localAsUtc - timeZoneOffset(result));
  return result;
}

function parseMetadata(observation: string | null): MarkerMetadata | null {
  if (!observation?.startsWith(`${MARKER}:`)) return null;
  try {
    return JSON.parse(observation.slice(MARKER.length + 1)) as MarkerMetadata;
  } catch {
    return null;
  }
}

async function cleanDashboardData(tx: Prisma.TransactionClient) {
  const markedOrders = await tx.pedido.findMany({
    where: { clienteNombre: { startsWith: MARKER } },
    select: { id: true, turnoId: true, observacion: true }
  });
  const metadata = markedOrders.map((order) => parseMetadata(order.observacion)).find(Boolean);

  if (metadata) {
    for (const item of metadata.inventorySnapshot) {
      // No pisa cambios manuales realizados después del seed.
      await tx.inventario.updateMany({
        where: {
          id: item.id,
          stockActual: item.seededStockActual,
          stockMinimo: item.seededStockMinimo
        },
        data: { stockActual: item.stockActual, stockMinimo: item.stockMinimo }
      });
    }
  }

  if (markedOrders.length === 0) return 0;
  await tx.pedido.deleteMany({
    where: { id: { in: markedOrders.map((order) => order.id) } }
  });

  const turnoIds = [...new Set(markedOrders.flatMap((order) => (order.turnoId ? [order.turnoId] : [])))];
  for (const turnoId of turnoIds) {
    const remainingOrders = await tx.pedido.count({ where: { turnoId } });
    if (remainingOrders === 0) await tx.turno.delete({ where: { id: turnoId } });
  }
  return markedOrders.length;
}

function orderTime(dayIndex: number, orderIndex: number) {
  const lunchHours = [12, 13, 14];
  const peakHours = [19, 20, 21, 22];
  const hours = orderIndex % 5 === 0 ? lunchHours : peakHours;
  const hour = hours[(dayIndex + orderIndex) % hours.length];
  const minute = (dayIndex * 11 + orderIndex * 17) % (hour === 22 ? 30 : 60);
  return { hour, minute };
}

function historicalStatus(dayIndex: number, orderIndex: number) {
  return (dayIndex * 19 + orderIndex) % 14 === 0 ? "cancelado" : "entregado";
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed de dashboard abortado: no se permite ejecutarlo con NODE_ENV=production.");
  }

  const cleanOnly = process.argv.includes("--clean");
  const result = await prisma.$transaction(
    async (tx) => {
      const removed = await cleanDashboardData(tx);
      if (cleanOnly) return { removed, created: 0, criticalProducts: [] as string[] };

      const user = await tx.usuario.findFirst({
        where: { activo: true, role: { in: ["cajero", "admin"] } },
        orderBy: [{ role: "asc" }, { id: "asc" }]
      });
      if (!user) throw new Error("No existe un usuario activo cajero/admin. Ejecuta primero el seed general.");

      const products = await tx.producto.findMany({
        where: { disponible: true },
        include: {
          variantes: { where: { disponible: true }, orderBy: { orden: "asc" } }
        },
        orderBy: [{ destacado: "desc" }, { id: "asc" }],
        take: 10
      });
      if (products.length < 5) throw new Error("Se requieren al menos 5 productos disponibles existentes.");

      const inventory = await tx.inventario.findMany({
        where: { producto: { controlaStock: true, tipo: "producto" } },
        include: { producto: { select: { nombre: true } } },
        orderBy: { productoId: "asc" }
      });
      if (inventory.length < 3) throw new Error("Se requieren al menos 3 inventarios controlados para stock crítico.");

      const critical = inventory.slice(0, 3);
      const seededStocks = [3, 2, 0];
      const snapshot: InventorySnapshot[] = critical.map((item, index) => ({
        id: item.id,
        stockActual: item.stockActual,
        stockMinimo: item.stockMinimo,
        seededStockActual: Math.min(seededStocks[index], Math.max(item.stockMinimo, 5)),
        seededStockMinimo: Math.max(item.stockMinimo, [10, 5, 8][index])
      }));
      for (const item of snapshot) {
        await tx.inventario.update({
          where: { id: item.id },
          data: {
            stockActual: item.seededStockActual,
            stockMinimo: item.seededStockMinimo
          }
        });
      }

      const today = zonedDateParts(new Date());
      let sequence = 0;
      for (let dayIndex = 0; dayIndex < ORDER_COUNTS.length; dayIndex += 1) {
        const date = addDays(today, dayIndex - 6);
        const isToday = dayIndex === 6;
        const shiftStart = localDateTimeToUtc(date, 11, 30);
        const shiftEnd = localDateTimeToUtc(date, 23, 0);
        const turno = await tx.turno.create({
          data: {
            usuarioId: user.id,
            estado: isToday ? "abierto" : "cerrado",
            fechaInicio: shiftStart,
            fechaCierre: isToday ? null : shiftEnd,
            resumen: {
              source: MARKER,
              date: `${date.year}-${date.month}-${date.day}`
            }
          }
        });

        const todayStatuses = [
          "pendiente",
          "pendiente",
          "en_preparacion",
          "en_preparacion",
          "listo",
          "cancelado",
          ...Array(10).fill("entregado")
        ];
        for (let orderIndex = 0; orderIndex < ORDER_COUNTS[dayIndex]; orderIndex += 1) {
          const { hour, minute } = orderTime(dayIndex, orderIndex);
          const createdAt = localDateTimeToUtc(date, hour, minute);
          const detailCount = 1 + ((sequence + dayIndex) % 3);
          const details = Array.from({ length: detailCount }, (_, detailIndex) => {
            // Favorece los primeros productos para formar un ranking estable y visible.
            const weightedIndex = (sequence + detailIndex * 2) % 10;
            const productIndex =
              weightedIndex < 4
                ? 0
                : weightedIndex < 7
                  ? 1
                  : weightedIndex < 9
                    ? 2
                    : 3 + ((sequence + detailIndex) % (products.length - 3));
            const product = products[productIndex];
            const cantidad = (sequence + detailIndex * 7) % 17 === 0 ? 3 : (sequence + detailIndex) % 7 === 0 ? 2 : 1;
            const precioUnitario = product.precio;
            const subtotal = precioUnitario.mul(cantidad);
            const variant = product.variantes.length
              ? product.variantes[(sequence + detailIndex) % product.variantes.length]
              : null;
            return {
              productoId: product.id,
              varianteId: variant?.id ?? null,
              cantidad,
              precioUnitario,
              subtotal
            };
          });
          const total = details.reduce((sum, detail) => sum.add(detail.subtotal), new Prisma.Decimal(0));
          const estado = isToday ? todayStatuses[orderIndex] : historicalStatus(dayIndex, orderIndex);
          const observation = sequence === 0 ? `${MARKER}:${JSON.stringify({ inventorySnapshot: snapshot })}` : MARKER;

          await tx.pedido.create({
            data: {
              total,
              estado,
              metodoPago: PAYMENT_METHODS[(sequence * 37) % PAYMENT_METHODS.length],
              clienteNombre: CUSTOMER_NAME,
              observacion: observation,
              createdAt,
              updatedAt: createdAt,
              turnoId: turno.id,
              detalles: { create: details },
              historial: {
                create: {
                  usuarioId: user.id,
                  accion: "creado_por_seed_dashboard",
                  createdAt
                }
              }
            }
          });
          sequence += 1;
        }
      }

      return {
        removed,
        created: sequence,
        criticalProducts: critical.map((item) => item.producto.nombre)
      };
    },
    { timeout: 30_000 }
  );

  if (cleanOnly) console.log(`Limpieza dashboard terminada: ${result.removed} pedidos eliminados.`);
  else {
    console.log(
      `Seed dashboard terminado: ${result.created} pedidos creados (${result.removed} anteriores reemplazados).`
    );
    console.log(`Stock crítico preparado: ${result.criticalProducts.join(", ")}.`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
